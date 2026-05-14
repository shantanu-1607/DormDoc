/**
 * scopeToDepartment middleware
 *
 * Must run AFTER authenticateToken and requireRole(['hod']).
 *
 * Reads req.user.hodDepartment (set from the Faculty document) and injects
 * req.scope.department so that every HOD route handler can safely use
 * req.scope.department for DB queries without ever trusting request
 * query/body parameters for department scoping.
 *
 * Returns 403 if the HOD has no hodDepartment assigned — this prevents
 * a misconfigured HOD account from accidentally seeing all departments.
 */
const scopeToDepartment = (req, res, next) => {
  const dept = req.user && req.user.hodDepartment;

  if (!dept) {
    return res.status(403).json({
      message: 'HOD department scope is not configured for this account. Contact admin.',
    });
  }

  // Initialise req.scope if not already present (defensive)
  req.scope = req.scope || {};
  req.scope.department = dept;

  next();
};

module.exports = scopeToDepartment;
