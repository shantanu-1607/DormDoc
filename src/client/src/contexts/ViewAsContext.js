import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// "View as" lets a high-privilege user (admin or HOD) preview any other
// role's dashboard while staying signed in as themselves. The choice lives
// in localStorage so it persists across reloads but doesn't ship to the
// server — every API call still goes out as the real user.

const STORAGE_KEY = 'dormdoc.viewAsRole';
const CHANGE_EVENT = 'dormdoc:viewAsChange';

const VALID_ROLES = new Set(['student', 'doctor', 'hod', 'admin', 'parent']);

const ViewAsContext = createContext({ viewAsRole: null, setViewAsRole: () => {} });

export const useViewAs = () => useContext(ViewAsContext);

const readStored = () => {
  try {
    const r = window.localStorage.getItem(STORAGE_KEY);
    return r && VALID_ROLES.has(r) ? r : null;
  } catch {
    return null;
  }
};

export const ViewAsProvider = ({ children }) => {
  const [viewAsRole, setViewAsRoleState] = useState(() => readStored());

  useEffect(() => {
    const handler = () => setViewAsRoleState(readStored());
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const setViewAsRole = useCallback((role) => {
    if (role && VALID_ROLES.has(role)) {
      window.localStorage.setItem(STORAGE_KEY, role);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setViewAsRoleState(role && VALID_ROLES.has(role) ? role : null);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <ViewAsContext.Provider value={{ viewAsRole, setViewAsRole }}>
      {children}
    </ViewAsContext.Provider>
  );
};

export const VIEW_AS_ROLES = ['student', 'doctor', 'hod', 'admin', 'parent'];
export const ROLES_ALLOWED_TO_SWITCH = new Set(['admin', 'hod']);
