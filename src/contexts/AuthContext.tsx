import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { MemberProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  memberProfile: MemberProfile | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = memberProfile?.role === 'admin';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch their specific golfer profile from Firestore
        const docRef = doc(db, 'members', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMemberProfile({ id: docSnap.id, ...docSnap.data() } as MemberProfile);
        } else {
          setMemberProfile(null);
        }
      } else {
        setMemberProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, memberProfile, isAdmin, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
