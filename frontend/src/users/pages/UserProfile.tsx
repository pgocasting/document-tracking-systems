import { Building2, Key, Mail, User } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
const API_URL = RAW_API_URL.replace(/\/$/, "").endsWith("/api")
  ? RAW_API_URL.replace(/\/$/, "")
  : `${RAW_API_URL.replace(/\/$/, "")}/api`

type UserProfileProps = {
  user?: {
    username: string
    role: string
    office?: string
  }
}

export default function UserProfile({ user }: UserProfileProps) {
  type ProfileTab = "office_email" | "department_head" | "change_password"

  const [tab, setTab] = useState<ProfileTab>("change_password")
  const [officeEmail, setOfficeEmail] = useState("jcpayumo@bataan.gov.ph")
  const [contactNumber, setContactNumber] = useState("")
  const [deptHead, setDeptHead] = useState("DEODAR Q. DIMAUANAHAN, MD")
  const [deptHeadDesignation, setDeptHeadDesignation] = useState("OIC: Chief of Hospital")
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [currentOfficeId, setCurrentOfficeId] = useState<number | null>(null)

  const usernameKey = useMemo(() => {
    return user?.username ? user.username : "User"
  }, [user?.username])

  const createdByName = useMemo(() => {
    try {
      const raw = localStorage.getItem('user')
      const parsed = raw ? (JSON.parse(raw) as { fullName?: string; username?: string } | null) : null
      const fullName = String(parsed?.fullName || '').trim()
      if (fullName) return fullName
      const fallbackUsername = String(parsed?.username || '').trim()
      return fallbackUsername || usernameKey
    } catch {
      return usernameKey
    }
  }, [usernameKey])

  const settingsKey = useMemo(() => {
    return `user_profile_settings:${usernameKey}`
  }, [usernameKey])

  const currentOfficeName = useMemo(() => {
    const fromProp = String((user as any)?.office || '').trim()
    if (fromProp) return fromProp
    try {
      const raw = localStorage.getItem('user')
      if (!raw) return ''
      const parsed = JSON.parse(raw) as { office?: string } | null
      return String(parsed?.office || '').trim()
    } catch {
      return ''
    }
  }, [user])

  useEffect(() => {
    ;(async () => {
      // 1) Load from DB first
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const data = (await res.json()) as {
            profile?: {
              officeEmail?: string
              contactNumber?: string
              deptHead?: string
              deptHeadDesignation?: string
            }
          }

          const profile = data?.profile
          if (profile) {
            if (typeof profile.officeEmail === 'string') setOfficeEmail(profile.officeEmail)
            if (typeof profile.contactNumber === 'string') setContactNumber(profile.contactNumber)
            if (typeof profile.deptHead === 'string' && profile.deptHead.trim()) setDeptHead(profile.deptHead)
            if (typeof profile.deptHeadDesignation === 'string' && profile.deptHeadDesignation.trim())
              setDeptHeadDesignation(profile.deptHeadDesignation)

            try {
              localStorage.setItem(
                settingsKey,
                JSON.stringify({
                  officeEmail: typeof profile.officeEmail === 'string' ? profile.officeEmail : officeEmail,
                  contactNumber: typeof profile.contactNumber === 'string' ? profile.contactNumber : contactNumber,
                  deptHead: typeof profile.deptHead === 'string' ? profile.deptHead : deptHead,
                  deptHeadDesignation:
                    typeof profile.deptHeadDesignation === 'string'
                      ? profile.deptHeadDesignation
                      : deptHeadDesignation,
                })
              )
            } catch {
              // ignore
            }
            return
          }
        }
      } catch {
        // ignore
      }

      // 2) Fallback to localStorage
      try {
        const raw = localStorage.getItem(settingsKey)
        if (!raw) return
        const parsed = JSON.parse(raw) as {
          officeEmail?: string
          contactNumber?: string
          deptHead?: string
          deptHeadDesignation?: string
        }
        if (typeof parsed.officeEmail === "string") setOfficeEmail(parsed.officeEmail)
        if (typeof parsed.contactNumber === "string") setContactNumber(parsed.contactNumber)
        if (typeof parsed.deptHead === "string") setDeptHead(parsed.deptHead)
        if (typeof parsed.deptHeadDesignation === "string") setDeptHeadDesignation(parsed.deptHeadDesignation)
      } catch {
        // ignore
      }
    })()
  }, [settingsKey])

  useEffect(() => {
    if (!currentOfficeName) return

    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_URL}/offices`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) return
        const data = (await res.json()) as {
          offices?: Array<{ officeId?: number; name?: string; head?: string; headDesignation?: string; email?: string }>
        }

        const match = (data.offices || []).find((o) => {
          const name = String(o?.name || '').trim().toLowerCase()
          return name && name === currentOfficeName.trim().toLowerCase()
        })

        if (!match) return
        const officeId = Number((match as any)?.officeId)
        if (Number.isFinite(officeId)) setCurrentOfficeId(officeId)
        const head = String(match.head || '').trim()
        const designation = String(match.headDesignation || '').trim()
        const email = String(match.email || '').trim()
        if (head) setDeptHead(head)
        if (designation) setDeptHeadDesignation(designation)
        if (email) setOfficeEmail(email)
      } catch {
        // ignore
      }
    })()
  }, [currentOfficeName])

  const patchOffice = async (body: { email?: string; head?: string; headDesignation?: string }) => {
    if (!currentOfficeId) throw new Error('Office not found for this user.')
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_URL}/offices/${currentOfficeId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(msg || 'Failed to update office')
    }
  }

  useEffect(() => {
    if (!status) return
    const t = window.setTimeout(() => setStatus(null), 2500)
    return () => window.clearTimeout(t)
  }, [status])

  function tabClass(isActive: boolean) {
    return isActive
      ? "inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-medium text-white shadow-sm"
      : "inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
  }

  return (
    <div className="w-full space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-600">Manage your account information and preferences</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-xl bg-slate-100">
                <User className="size-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {createdByName}
                </div>
                <div className="text-xs text-slate-500">{user?.role === "staff" ? "Staff User" : "Viewer"}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-slate-400" />
                <span className="truncate">{officeEmail}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" className={tabClass(tab === "office_email")} onClick={() => setTab("office_email")}
              title="Office Email">
              <Mail className="size-4" />
              Office Email
            </button>
            <button
              type="button"
              className={tabClass(tab === "department_head")}
              onClick={() => setTab("department_head")}
              title="Department Head"
            >
              <Building2 className="size-4" />
              Department Head
            </button>
            <button
              type="button"
              className={tabClass(tab === "change_password")}
              onClick={() => setTab("change_password")}
              title="Change Password"
            >
              <Key className="size-4" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {status ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm lg:col-span-3 ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        {tab === "change_password" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <Key className="size-5 text-slate-500" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Change Password Form</div>
                <div className="text-xs text-slate-500">Update your password to keep your account secure.</div>
              </div>
            </div>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                setStatus(null)
                if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                  setStatus({ type: "error", message: "Please fill out all password fields." })
                  return
                }
                if (passwordForm.newPassword !== passwordForm.confirmPassword) return
                setStatus({ type: "success", message: "Password updated successfully." })
                setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
              }}
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Old Password</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm((v) => ({ ...v, oldPassword: e.target.value }))}
                  aria-label="Old Password"
                  title="Old Password"
                  placeholder="Old Password"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus-visible:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((v) => ({ ...v, newPassword: e.target.value }))}
                  aria-label="New Password"
                  title="New Password"
                  placeholder="New Password"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus-visible:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Re-Enter New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((v) => ({ ...v, confirmPassword: e.target.value }))}
                  aria-label="Re-Enter New Password"
                  title="Re-Enter New Password"
                  placeholder="Re-Enter New Password"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus-visible:outline-none"
                />
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? (
                  <div className="text-xs text-rose-600">Passwords do not match.</div>
                ) : null}
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:outline-none"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        ) : tab === "office_email" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="size-5 text-slate-500" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Office Email</div>
                <div className="text-xs text-slate-500">Set the email used for office communications.</div>
              </div>
            </div>
            <form
              className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault()
                ;(async () => {
                  setStatus(null)
                  const emailValue = officeEmail.trim()
                  if (!emailValue) {
                    setStatus({ type: "error", message: "Please enter an email." })
                    return
                  }

                  try {
                    await patchOffice({ email: emailValue })

                    // Keep profile contact number update (user-specific)
                    const token = localStorage.getItem('token')
                    const res = await fetch(`${API_URL}/profile`, {
                      method: 'PATCH',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        officeEmail: emailValue,
                      }),
                    })

                    if (!res.ok) {
                      const msg = await res.text().catch(() => '')
                      throw new Error(msg || 'Failed to save')
                    }

                    try {
                      localStorage.setItem(
                        settingsKey,
                        JSON.stringify({
                          officeEmail: emailValue,
                          contactNumber,
                          deptHead,
                          deptHeadDesignation,
                        })
                      )
                    } catch {
                      // ignore
                    }

                    setOfficeEmail(emailValue)
                    setStatus({ type: "success", message: "Office email updated." })
                  } catch (err) {
                    setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to save. Please try again." })
                  }
                })()
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={officeEmail}
                    onChange={(e) => setOfficeEmail(e.target.value)}
                    aria-label="Office Email"
                    title="Office Email"
                    placeholder="office@domain.com"
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus-visible:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Created by</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <User className="size-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={createdByName}
                      disabled
                      aria-label="Created by"
                      title="Created by"
                      placeholder="-"
                      className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus-visible:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:outline-none"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="size-5 text-slate-500" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Department Head</div>
                <div className="text-xs text-slate-500">Maintain the signatory name and designation.</div>
              </div>
            </div>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                ;(async () => {
                  setStatus(null)
                  const nameValue = deptHead.trim()
                  const desigValue = deptHeadDesignation.trim()
                  if (!nameValue || !desigValue) {
                    setStatus({ type: "error", message: "Please fill out Department Head and Designation." })
                    return
                  }

                  try {
                    await patchOffice({ head: nameValue, headDesignation: desigValue })

                    // Keep profile update for backward compatibility
                    const token = localStorage.getItem('token')
                    const res = await fetch(`${API_URL}/profile`, {
                      method: 'PATCH',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        deptHead: nameValue,
                        deptHeadDesignation: desigValue,
                      }),
                    })

                    if (!res.ok) {
                      const msg = await res.text().catch(() => '')
                      throw new Error(msg || 'Failed to save')
                    }

                    try {
                      localStorage.setItem(
                        settingsKey,
                        JSON.stringify({
                          officeEmail,
                          contactNumber,
                          deptHead: nameValue,
                          deptHeadDesignation: desigValue,
                        })
                      )
                    } catch {
                      // ignore
                    }

                    setDeptHead(nameValue)
                    setDeptHeadDesignation(desigValue)
                    setStatus({ type: "success", message: "Department Head updated." })
                  } catch (err) {
                    setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to save. Please try again." })
                  }
                })()
              }}
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Department Head</label>
                <input
                  type="text"
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  aria-label="Department Head"
                  title="Department Head"
                  placeholder="Department Head"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus-visible:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Designation</label>
                <input
                  type="text"
                  value={deptHeadDesignation}
                  onChange={(e) => setDeptHeadDesignation(e.target.value)}
                  aria-label="Designation"
                  title="Designation"
                  placeholder="Designation"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus-visible:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:outline-none"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
