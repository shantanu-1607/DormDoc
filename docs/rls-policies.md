# DormDoc RLS Policies

> Phase 1.4 reference. All 20 tables in `public` have RLS enabled (default-deny). Policies below grant access on top of the deny. Service role bypasses RLS entirely; that's how Express + admin scripts will write through.

## Trust model

- **Source of truth for role:** `profiles.role` (enum). Role is set by the `auth.users → profiles` trigger to `'student'` on signup; only `admin` (or service_role) can change it.
- **Helpers are `SECURITY DEFINER`** so they can read `profiles` from inside policies without re-entering RLS (which would infinite-loop).
- **Helpers exposed only to `authenticated`** — `REVOKE EXECUTE FROM PUBLIC, anon`. Anon can't call them via PostgREST RPC.
- **All policies are scoped `TO authenticated`** — anon role gets zero access through the API (it can still hit `/auth/*` endpoints, but no tables).
- **Append-only tables** (`leave_decisions`, `login_logs`, `ambulance_trip_status_log`) deliberately have no UPDATE/DELETE policies — RLS default-deny blocks both.
- **Role-escalation guard on `profiles`:** the self-UPDATE policy's `WITH CHECK` pins `role` to its current value via `current_role_v()`. Admins use a separate policy without that pin.
- **Verification-flag guard on `parents`:** `is_verified` follows the same pattern — admin-only via a separate policy.

## Helper functions (`public` schema)

| Function | Returns | Reads |
|---|---|---|
| `current_role_v()` | `user_role` | `profiles.role` for `auth.uid()` |
| `is_admin()` | `boolean` | role = 'admin' |
| `is_doctor()` | `boolean` | role = 'doctor' |
| `is_dispensary_staff()` | `boolean` | role ∈ ('doctor', 'dispensary_staff') |
| `is_hod()` | `boolean` | role = 'hod' |
| `is_faculty()` | `boolean` | role ∈ ('faculty', 'hod') |
| `is_parent()` | `boolean` | role = 'parent' |
| `is_student()` | `boolean` | role = 'student' |
| `hod_department()` | `text` | `faculty.hod_department` for `auth.uid()` |
| `student_department(uuid)` | `text` | `students.department` for arg |
| `parent_of_student(uuid)` | `boolean` | `parent_student_links` for `auth.uid()` |

## Per-table policy matrix

Legend: ✓ allowed, ✗ denied, **self** = `id/student_id/etc. = auth.uid()`, **dept** = HOD's dept matches target.

### profiles
| Op | Allowed |
|---|---|
| SELECT | self · admin · dispensary_staff · HOD (matching dept for students/faculty) · parent (linked students) |
| INSERT | admin (signup uses the trigger which bypasses RLS) |
| UPDATE | self (role pinned) · admin |
| DELETE | admin |

### students
| Op | Allowed |
|---|---|
| SELECT | self · admin · dispensary_staff · HOD (dept) · parent (linked) |
| INSERT | admin |
| UPDATE | self · dispensary_staff · admin |
| DELETE | admin |

### faculty
| Op | Allowed |
|---|---|
| SELECT | self · admin · HOD (dept) |
| INSERT/DELETE | admin |
| UPDATE | self · admin |

### parents
| Op | Allowed |
|---|---|
| SELECT | self · admin · HOD (dept-of-linked-student) |
| INSERT/DELETE | admin |
| UPDATE | self (`is_verified` pinned) · admin |

### dispensary_staff
| Op | Allowed |
|---|---|
| SELECT | any authenticated |
| INSERT/DELETE | admin |
| UPDATE | self · admin |

### parent_student_links
| Op | Allowed |
|---|---|
| SELECT | own parent · own student · admin |
| INSERT/UPDATE/DELETE | admin |

### staff_availability
| Op | Allowed |
|---|---|
| SELECT | any authenticated |
| INSERT/UPDATE/DELETE | own staff · admin |

### medical_history
| Op | Allowed |
|---|---|
| SELECT | own student · dispensary_staff · HOD (dept) · admin |
| INSERT/UPDATE | dispensary_staff · admin |
| DELETE | admin |

### appointments
| Op | Allowed |
|---|---|
| SELECT | own student · own doctor · admin · HOD (dept) |
| INSERT | own student · dispensary_staff · admin |
| UPDATE | own student · own doctor · admin |
| DELETE | admin |

### leave_requests
| Op | Allowed |
|---|---|
| SELECT | own student · own decider · admin · HOD (dept) |
| INSERT | own student · admin |
| UPDATE | faculty · admin (student cancels via DELETE) |
| DELETE | own student (only while `status='pending'`) · admin |

### prescriptions
| Op | Allowed |
|---|---|
| SELECT | own student · own doctor · admin · parent (linked) · HOD (dept) |
| INSERT | dispensary_staff · admin |
| UPDATE | doctor-author · admin |
| DELETE | admin |

### prescription_medications
Inherits SELECT visibility from parent prescription (via `EXISTS`). Mutations: doctor-author of parent prescription · admin.

### inventory_items
| Op | Allowed |
|---|---|
| SELECT | any authenticated |
| INSERT/UPDATE | dispensary_staff · admin |
| DELETE | admin |

### ambulances · ambulance_equipment · ambulance_maintenance_issues
| Op | Allowed |
|---|---|
| SELECT | any authenticated |
| INSERT | admin (ambulances) · dispensary_staff/admin (equipment, issues) |
| UPDATE | dispensary_staff · admin |
| DELETE | admin |

### ambulance_trips
| Op | Allowed |
|---|---|
| SELECT | passenger student · driver · creator · dispensary_staff · admin |
| INSERT | dispensary_staff · admin |
| UPDATE | driver · dispensary_staff · admin |
| DELETE | admin |

### ambulance_trip_status_log
Append-only. SELECT inherits from parent trip. INSERT: driver of trip · dispensary_staff · admin. UPDATE/DELETE: ✗.

### leave_decisions
Append-only. SELECT: subject student · decider · HOD (dept) · admin. INSERT: faculty · admin. UPDATE/DELETE: ✗.

### login_logs
Append-only. SELECT: self · admin. INSERT: admin only (service_role writes from server). UPDATE/DELETE: ✗.

## What goes through `service_role`

Routes that need to bypass RLS (use service-role client server-side):
- **Signup / profile bootstrap** — handled by the `on_auth_user_created` trigger (already `SECURITY DEFINER`).
- **Login logging** — server writes to `login_logs` directly.
- **Admin role assignment** — initial admin promotion + role changes done via a server route or one-off migration.
- **Cross-tenant reads** — analytics aggregations that need to see across roles.

## Next steps

- 1.4 follow-up: write a pgTAP test suite (`supabase/tests/`) that signs in as each role and asserts the policy matrix.
- Phase 2: confirm the `handle_new_user` trigger continues to fire after we move to Supabase Auth and email OTP.
- Phase 3 review: any route migrated to supabase-js with the user's JWT (not service-role) needs an RLS sanity check.
