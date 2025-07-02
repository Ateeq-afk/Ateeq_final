import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { email, branchId, role } = await req.json();
  if (!email || !branchId || !role) {
    return new Response(JSON.stringify({ error: "email, branchId and role required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { branch_id: branchId, role }
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = data?.user?.id;
  if (userId) {
    await supabase.from('custom_users').insert({
      id: userId,
      branch_id: branchId,
      role,
      email,
      name: '',
      phone: ''
    });
  }

  return new Response(JSON.stringify({ user: data?.user }), {
    headers: { "Content-Type": "application/json" }
  });
});
