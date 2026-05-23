-- Phase 4: Realtime — enable postgres_changes for the four tables that
-- back the client toast notifications previously delivered over socket.io.
--
-- REPLICA IDENTITY FULL means UPDATE events ship the old row too, which
-- lets the client detect transitions (e.g. is_on_duty flipped, status
-- changed) without retoasting on every unrelated update.

alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.ambulance_trips;
alter publication supabase_realtime add table public.leave_requests;
alter publication supabase_realtime add table public.dispensary_staff;

alter table public.appointments replica identity full;
alter table public.ambulance_trips replica identity full;
alter table public.leave_requests replica identity full;
alter table public.dispensary_staff replica identity full;
