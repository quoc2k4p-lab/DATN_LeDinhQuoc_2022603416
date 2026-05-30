"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { createContactRequestAction } from "@/lib/actions/leadActions";

const CONSULT_OPTIONS = [
  "Tư vấn mua xe",
  "Trả góp ngân hàng",
  "Xe mới về",
  "Định giá xe cũ",
  "Đặt lịch xem xe",
  "Báo giá xe",
  "Hỗ trợ kỹ thuật",
  "Khác",
];

export function ContactForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consultationType, setConsultationType] = useState(CONSULT_OPTIONS[0]);
  const [message, setMessage] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = "Họ tên là bắt buộc.";
    }
    
    const phoneClean = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      errs.phone = "Số điện thoại là bắt buộc.";
    } else if (phoneClean.length < 9 || phoneClean.length > 11) {
      errs.phone = "Số điện thoại không hợp lệ (9 - 11 chữ số).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = "Email là bắt buộc.";
    } else if (!emailRegex.test(email.trim())) {
      errs.email = "Email không đúng định dạng.";
    }

    if (!message.trim()) {
      errs.message = "Vui lòng nhập nội dung cần tư vấn.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validate()) return;

    setIsPending(true);
    try {
      const res = await createContactRequestAction({
        full_name: fullName,
        phone,
        email,
        consultation_type: consultationType,
        message,
      });

      if (res.success) {
        setSuccess(true);
        // Clear form
        setFullName("");
        setPhone("");
        setEmail("");
        setConsultationType(CONSULT_OPTIONS[0]);
        setMessage("");
      } else {
        setSubmitError(res.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Lỗi hệ thống, vui lòng thử lại sau.");
    } finally {
      setIsPending(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-8 text-center shadow-lg animate-fadeIn">
        <CheckCircle2 size={54} className="mx-auto text-emerald-500 mb-4 animate-bounce" />
        <h3 className="font-display text-xl font-bold text-white mb-2">Gửi yêu cầu thành công</h3>
        <p className="text-sm text-zinc-300 leading-relaxed mb-6">
          Yêu cầu tư vấn đã được gửi.<br />
          Đội ngũ TQ Auto sẽ liên hệ với bạn sớm nhất.
        </p>
        <Button onClick={() => setSuccess(false)} variant="secondary" className="mx-auto font-bold">
          Gửi yêu cầu mới
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border theme-surface p-6 shadow-md transition duration-300 hover:border-white/15">
      {submitError && (
        <div className="mb-5 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="font-semibold">{submitError}</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <FormField 
          label="Họ tên" 
          placeholder="Nguyễn Văn A" 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          disabled={isPending}
          required
        />
        
        <FormField 
          label="Số điện thoại" 
          placeholder="0909 888 668" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          disabled={isPending}
          required
        />
        
        <FormField 
          label="Email" 
          type="email" 
          placeholder="email@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isPending}
          required
        />
        
        <FormField 
          label="Nhu cầu" 
          as="select" 
          options={CONSULT_OPTIONS} 
          value={consultationType}
          onChange={(e) => setConsultationType(e.target.value)}
          disabled={isPending}
          required
        />
        
        <div className="md:col-span-2">
          <FormField 
            label="Nội dung" 
            as="textarea" 
            placeholder="Nhập chi tiết nhu cầu hoặc loại xe bạn quan tâm..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={errors.message}
            disabled={isPending}
            required
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button 
          type="submit" 
          disabled={isPending}
          className="relative min-w-32 overflow-hidden transition-all duration-300 active:scale-95 font-bold flex items-center justify-center gap-2 hover:bg-[#e31837] hover:shadow-lg hover:shadow-red-600/20"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            "Gửi yêu cầu"
          )}
        </Button>
      </div>
    </form>
  );
}
