/** @format */

import { useEffect, useState } from "react";
import { GetAdminProfileAPI } from "@/services/Api/AuthApi";

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  role_id: number;
  department_id: number;
  admin_role?: { id: number; name: string; abbreviation: string };
}

// Fetched once per page load and shared by the header, sidebar and route
// guard. Login and logout do a full reload, which resets it.
let profilePromise: Promise<AdminProfile | null> | null = null;

const fetchProfile = () => {
  if (!profilePromise) {
    const token = localStorage.getItem("token");
    profilePromise = token
      ? GetAdminProfileAPI({ token })
          .then((res) => (res.data?.data as AdminProfile) ?? null)
          .catch(() => null)
      : Promise.resolve(null);
  }
  return profilePromise;
};

export const useAdminProfile = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchProfile().then((p) => {
      if (!active) return;
      setProfile(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { profile, loading, abbreviation: profile?.admin_role?.abbreviation };
};
