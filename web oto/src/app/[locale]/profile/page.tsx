"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { User, ShieldCheck, Mail, Phone, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { getMeAction, updateCustomerProfileAction, changeCustomerPasswordAction } from "@/lib/actions/auth";

export default function MyAccountPage() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const [user, setUser] = useState<{ id: string; name: string; email: string; phone: string; avatar?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    email: "",
    avatar: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  useEffect(() => {
    async function loadUser() {
      const res = await getMeAction();
      if (res.success && res.user) {
        setUser(res.user);
        setProfileData({
          fullName: res.user.name,
          phone: res.user.phone,
          email: res.user.email,
          avatar: res.user.avatar || "",
        });
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  // Handle auto-scroll to Change Password section if focus parameter is present
  useEffect(() => {
    if (!loading && searchParams.get("focus") === "change-password") {
      setTimeout(() => {
        passwordSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus on first password field if possible
        const pwdInput = passwordSectionRef.current?.querySelector("input[name='currentPassword']") as HTMLInputElement;
        if (pwdInput) pwdInput.focus();
      }, 300);
    }
  }, [loading, searchParams]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert uploaded image to base64 data URL
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileStatus({ type: "error", message: t("avatarDescription") });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileData((prev) => ({ ...prev, avatar: base64String }));
      
      // Auto-submit avatar change to server
      startProfileTransition(async () => {
        const formData = new FormData();
        formData.append("fullName", profileData.fullName);
        formData.append("phone", profileData.phone);
        formData.append("email", profileData.email);
        formData.append("avatar", base64String);

        const result = await updateCustomerProfileAction(formData);
        if (result.success && result.user) {
          setProfileStatus({ type: "success", message: t("saveChanges") + " " + t("uploadAvatar") });
          // Update compatibility storage
          const mappedUser = {
            ...result.user,
            role: result.user.role === "admin" ? "Quản trị viên" : result.user.role === "staff" ? "Nhân viên" : "Khách hàng",
          };
          window.localStorage.setItem("tq-auto-user", JSON.stringify(mappedUser));
          // Dispatch storage event to alert other components
          window.dispatchEvent(new Event("storage"));
        } else {
          setProfileStatus({ type: "error", message: result.message || "Failed to upload avatar" });
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileStatus({ type: null, message: "" });

    startProfileTransition(async () => {
      const formData = new FormData();
      formData.append("fullName", profileData.fullName);
      formData.append("phone", profileData.phone);
      formData.append("email", profileData.email);
      if (profileData.avatar) {
        formData.append("avatar", profileData.avatar);
      }

      const result = await updateCustomerProfileAction(formData);
      if (result.success && result.user) {
        setProfileStatus({ type: "success", message: result.message || "Cập nhật thành công!" });
        const mappedUser = {
          ...result.user,
          role: result.user.role === "admin" ? "Quản trị viên" : result.user.role === "staff" ? "Nhân viên" : "Khách hàng",
        };
        window.localStorage.setItem("tq-auto-user", JSON.stringify(mappedUser));
        window.dispatchEvent(new Event("storage"));
        
        // Reload page to propagate header updates
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setProfileStatus({ type: "error", message: result.message || "Cập nhật thất bại" });
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: "" });

    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Mật khẩu mới phải có tối thiểu 6 ký tự." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: "error", message: "Mật khẩu xác nhận không khớp." });
      return;
    }

    startPasswordTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", passwordData.currentPassword);
      formData.append("newPassword", passwordData.newPassword);
      formData.append("confirmPassword", passwordData.confirmPassword);

      const result = await changeCustomerPasswordAction(formData);
      if (result.success) {
        setPasswordStatus({ type: "success", message: result.message || "Đổi mật khẩu thành công!" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordStatus({ type: "error", message: result.message || "Đổi mật khẩu thất bại" });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#e31837]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Account Details Card */}
      <section className="rounded-lg border theme-border bg-[#11161d] p-6 shadow-md">
        <div className="flex items-center gap-3 border-b theme-border pb-4 mb-6">
          <User className="text-[#e31837]" size={20} />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">{t("personalInfo")}</h2>
        </div>

        {profileStatus.type === "success" && (
          <div className="mb-6 flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{profileStatus.message}</p>
          </div>
        )}

        {profileStatus.type === "error" && (
          <div className="mb-6 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{profileStatus.message}</p>
          </div>
        )}

        {/* Avatar Uploader Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-6 border-b theme-border">
          <div className="relative group">
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt="Avatar Preview"
                className="h-24 w-24 rounded-full object-cover border-2 border-[#e31837] shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1a1f28] text-3xl font-bold text-[#e31837] border-2 border-dashed border-[#e31837]/35">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {isProfilePending && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                <Loader2 className="h-6 w-6 animate-spin text-[#e31837]" />
              </div>
            )}
          </div>
          
          <div className="text-center sm:text-left">
            <label className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#e31837] to-[#c2142d] px-4 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition cursor-pointer">
              <Upload size={14} />
              {t("uploadAvatar")}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isProfilePending}
              />
            </label>
            <p className="mt-2 text-xs text-[#a1a1aa] theme-subtle">
              {t("avatarDescription")}
            </p>
          </div>
        </div>

        {/* Profile Info Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label={t("fullName")}
              name="fullName"
              placeholder="Nguyễn Văn A"
              value={profileData.fullName}
              onChange={handleProfileChange}
              required
              disabled={isProfilePending}
            />
            <FormField
              label={t("phone")}
              name="phone"
              placeholder="0909888668"
              value={profileData.phone}
              onChange={handleProfileChange}
              required
              disabled={isProfilePending}
            />
            <FormField
              label={t("email")}
              name="email"
              type="email"
              placeholder="email@example.com"
              value={profileData.email}
              onChange={handleProfileChange}
              required
              disabled={isProfilePending}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isProfilePending}
              className="h-10 text-xs tracking-wider"
            >
              {isProfilePending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                t("saveChanges")
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* 2. Security & Password Card */}
      <section 
        ref={passwordSectionRef}
        className="rounded-lg border theme-border bg-[#11161d] p-6 shadow-md"
      >
        <div className="flex items-center gap-3 border-b theme-border pb-4 mb-6">
          <ShieldCheck className="text-[#e31837]" size={20} />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">{t("changePasswordTitle")}</h2>
        </div>

        {passwordStatus.type === "success" && (
          <div className="mb-6 flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{passwordStatus.message}</p>
          </div>
        )}

        {passwordStatus.type === "error" && (
          <div className="mb-6 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{passwordStatus.message}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            <FormField
              label={t("currentPassword")}
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              disabled={isPasswordPending}
            />
            <FormField
              label={t("newPassword")}
              name="newPassword"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              disabled={isPasswordPending}
            />
            <FormField
              label={t("confirmPassword")}
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              disabled={isPasswordPending}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPasswordPending}
              className="h-10 text-xs tracking-wider"
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                t("changePassword")
              )}
            </Button>
          </div>
        </form>
      </section>

    </div>
  );
}
