import { redirect } from "next/navigation";
import { createAdminClient } from "~/lib/supabase/admin";
import { createClient } from "~/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/");
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Admin — Users</h1>

      {error && (
        <p className="mb-4 text-sm text-red-500">
          Failed to load users: {error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Provider
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">
                Last Sign In
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 text-foreground">{u.email ?? "—"}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {u.app_metadata.provider ?? "email"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleDateString()
                    : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.users.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No users found.
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {data?.users.length ?? 0} user{data?.users.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
