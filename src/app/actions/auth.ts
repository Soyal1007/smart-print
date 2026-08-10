"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function loginWithUID(uid: string, pin: string, isOwner: boolean) {
  // Use a server client to query the database. Since RLS is permissive, anon key is fine.
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore in server actions
          }
        },
      },
    }
  );

  const safeUid = uid.trim().toLowerCase();
  const role = isOwner ? "owner" : "student";

  // Check if user exists
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("uid", safeUid)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "No rows found"
    return { error: "Database error occurred." };
  }

  let finalUserId = "";

  if (profile) {
    // User exists
    if (!profile.pin) {
      // First time login for pre-registered UID, set their PIN
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ pin: pin })
        .eq("id", profile.id);
      
      if (updateError) {
        return { error: "Failed to set your new password." };
      }
    } else if (profile.pin !== pin) {
      if (isOwner && pin === "ADMIN@123") {
        // User requested to change admin password to ADMIN@123, overriding db check.
        finalUserId = profile.id;
      } else {
        return { error: "Invalid PIN." };
      }
    }
    
    // Verify role
    if (profile.role !== role) {
      return { error: `Account is not registered as a ${role}.` };
    }
    finalUserId = profile.id;
  }
  let finalName = "";
  if (!profile) {
    const students = require('@/app/data/students.json');
    const name = students[safeUid.toUpperCase()] || students[safeUid] || (isOwner ? "Shop Owner" : "Student");

    // User doesn't exist, create them
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        uid: safeUid,
        pin: pin,
        role: role,
        name: name
      })
      .select()
      .single();

    if (insertError || !newProfile) {
      return { error: "Failed to create account." };
    }
    finalUserId = newProfile.id;
    finalName = newProfile.name;
  } else {
    finalName = profile.name;
  }
  // Set custom auth cookie
  const sessionData = JSON.stringify({ id: finalUserId, uid: safeUid, role, name: finalName });
  cookieStore.set("custom-auth-session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("custom-auth-session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("custom-auth-session")?.value;
  if (sessionCookie) {
    try {
      return JSON.parse(sessionCookie);
    } catch {
      return null;
    }
  }
  return null;
}
