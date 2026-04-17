import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useSiteData } from "@/hooks/useSiteData";


const RegistrationSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [eventLocked, setEventLocked] = useState(false);
  const { data: siteData } = useSiteData();

  const fetchFields = async (eventName: string) => {
    let { data } = await supabase
      .from("registration_form_fields")
      .select("*")
      .eq("is_active", true)
      .eq("event_name", eventName)
      .order("sort_order");

    if (!data || data.length === 0) {
      const res = await supabase
        .from("registration_form_fields")
        .select("*")
        .eq("is_active", true)
        .eq("event_name", "general")
        .order("sort_order");
      data = res.data;
    }

    if (data) {
      // Filter out the 'event' field — we handle event selection separately
      const filtered = data.filter((f) => f.field_name !== "event");
      setFormFields(filtered);
      const defaults: Record<string, string> = { event: eventName };
      filtered.forEach((f) => { defaults[f.field_name] = ""; });
      defaults.event = eventName;
      setFormData(defaults);
    }
  };

  // Auto-scroll to the register section whenever selectedEvent is set from an event card click
  useEffect(() => {
    if (selectedEvent && eventLocked) {
      // Small delay to allow React to re-render the form before scrolling
      const timer = setTimeout(() => {
        const el = document.getElementById("register");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedEvent, eventLocked]);

  useEffect(() => {
    fetchFields("general");

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        // Support both legacy string format and new {eventName, formLink} object format
        if (typeof detail === "string") {
          setSelectedEvent(detail);
          setEventLocked(true);
          fetchFields(detail);
        } else if (typeof detail === "object" && detail.eventName) {
          setSelectedEvent(detail.eventName);
          setEventLocked(true);
          // Fetch form using formLink (may differ from display name)
          fetchFields(detail.formLink || detail.eventName);
        }
      }
    };
    window.addEventListener("prefill-event", handler);
    return () => window.removeEventListener("prefill-event", handler);
  }, []);

  const handleEventSelect = (eventName: string) => {
    setSelectedEvent(eventName);
    setEventLocked(false);
    fetchFields(eventName);
  };

  const sendWhatsAppConfirmation = (name: string, email: string, event: string, phone: string, regId: string) => {
    const message = encodeURIComponent(
      `✅ *SRIJAN 4.0 Registration Confirmed!*\n\n` +
      `👤 *Name:* ${name}\n` +
      `🎯 *Event:* ${event}\n` +
      `🆔 *Reg ID:* ${regId}\n\n` +
      `📍 *Venue:* Quantum University, Uttarakhand\n` +
      `📅 *Date:* 23-25 April 2026\n\n` +
      `Your check-in QR code has been sent to your email. See you there! 🚀`
    );
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone) {
      // Use wa.me link to open WhatsApp
      window.open(`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${message}`, "_blank");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = formFields.filter((f) => f.is_required);
    for (const f of required) {
      if (!formData[f.field_name]) {
        toast.error(`Please fill in ${f.field_label}`);
        return;
      }
    }

    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }

    setSubmitting(true);
    const regId = `SRIJAN-${Date.now().toString(36).toUpperCase()}`;
    setRegistrationId(regId);

    const coreFields = ["name", "email", "phone", "organization", "event", "message"];
    const customFields: Record<string, string> = {};
    Object.entries(formData).forEach(([key, val]) => {
      if (!coreFields.includes(key) && val) customFields[key] = val;
    });

    // Resolve core fields with common aliases so data lands in the right columns
    const resolveName = formData.name || formData.full_name || formData.fullname || "";
    const resolveEmail = formData.email || formData.email_address || formData.mail || "";
    const resolvePhone = formData.phone || formData.mobile || formData.whatsapp || formData.phone_number || null;
    const resolveOrg = formData.organization || formData.college || formData.company || formData.institution || null;

    const { error } = await supabase.from("registrations").insert({
      registration_id: regId,
      name: resolveName,
      email: resolveEmail,
      phone: resolvePhone,
      organization: resolveOrg,
      event: selectedEvent,
      message: formData.message || null,
      custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
    });

    if (error) {
      toast.error("Registration failed. Please try again.");
      setSubmitting(false);
      return;
    }

    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(
        JSON.stringify({ id: regId, name: formData.name, email: formData.email, event: selectedEvent }),
        { width: 400, margin: 2 }
      );
    } catch (err) { console.error("QR generation failed:", err); }

    // Resolve name/email/phone from dynamic form fields (admin may use varied field names)
    const findField = (...keys: string[]) => {
      for (const k of keys) {
        const match = Object.keys(formData).find((fk) => fk.toLowerCase().includes(k));
        if (match && formData[match]) return formData[match];
      }
      return "";
    };
    const recipientName = resolveName || findField("name") || "Participant";
    const recipientEmail = resolveEmail || findField("email", "mail");
    const recipientPhone = resolvePhone || findField("phone", "mobile", "whatsapp") || "";
    const recipientOrg = resolveOrg || findField("organization", "college", "company") || "";

    if (!recipientEmail) {
      toast.warning("Registered, but no email address provided — confirmation email skipped.");
    } else {
      try {
        const { error: emailErr } = await supabase.functions.invoke("send-registration-email", {
          body: {
            name: recipientName,
            email: recipientEmail,
            event: selectedEvent,
            registrationId: regId,
            phone: recipientPhone,
            organization: recipientOrg,
            qrDataUrl,
            customFields,
          },
        });
        if (emailErr) {
          console.error("Email send error:", emailErr);
          toast.warning("Registered, but confirmation email failed to send.");
        } else {
          toast.success("Confirmation email sent to " + recipientEmail);
        }
      } catch (err) {
        console.error("Email invoke failed:", err);
        toast.warning("Registered, but confirmation email failed.");
      }
    }

    setSubmitted(true);
    if (formData.phone) {
      setTimeout(() => sendWhatsAppConfirmation(formData.name, formData.email, selectedEvent, formData.phone, regId), 1500);
    }
    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <section id="register" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center bg-card rounded-2xl p-12 shadow-elevated"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={32} className="text-primary" />
            </motion.div>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-3">Registration Confirmed!</h3>
            <p className="text-muted-foreground mb-6">
              Thank you, <span className="font-semibold text-foreground">{formData.name}</span>. Your registration for <span className="font-semibold text-primary">{selectedEvent}</span> has been received.
            </p>
            <div className="bg-primary/5 rounded-xl p-6 mb-6">
              <p className="text-sm text-foreground font-medium mb-2">Check your Inbox!</p>
              <p className="text-xs text-muted-foreground">
                We've sent your **Registration ID** and **Check-in QR Code** to <span className="text-primary">{formData.email}</span> and WhatsApp. Please keep them safe for the event.
              </p>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                setSelectedEvent("");
                setEventLocked(false);
                const defaults: Record<string, string> = {};
                formFields.forEach((f) => { defaults[f.field_name] = ""; });
                setFormData(defaults);
              }}
              className="mt-2 text-sm text-primary font-medium hover:underline"
            >
              Register for another event →
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  const renderField = (field: any) => {
    const baseClass = "w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

    switch (field.field_type) {
      case "select":
        return (
          <select name={field.field_name} value={formData[field.field_name] || ""} onChange={handleChange} required={field.is_required} className={baseClass}>
            <option value="">Choose...</option>
            {(field.options as string[] || []).map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case "textarea":
        return (
          <textarea name={field.field_name} value={formData[field.field_name] || ""} onChange={handleChange} rows={3} className={`${baseClass} resize-none`} placeholder={field.field_label} />
        );
      default:
        return (
          <input
            type={field.field_type}
            name={field.field_name}
            value={formData[field.field_name] || ""}
            onChange={handleChange}
            required={field.is_required}
            className={baseClass}
            placeholder={field.field_label}
          />
        );
    }
  };

  return (
    <section id="register" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Registration</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Secure Your <span className="text-gradient">Spot</span>
          </h2>
        </motion.div>

        {!selectedEvent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <p className="text-center text-muted-foreground mb-8">Select the event you want to register for:</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {siteData?.events?.map((eventName) => (
                <motion.button
                  key={eventName}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEventSelect(eventName)}
                  className="bg-card rounded-xl p-5 shadow-card hover:shadow-elevated text-left transition-all border border-border hover:border-primary/30"
                >
                  <h3 className="font-heading font-semibold text-foreground mb-1">{eventName}</h3>
                  <span className="text-xs text-primary font-medium">Register →</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-xl mx-auto">
              {!eventLocked && (
                <button
                  onClick={() => { setSelectedEvent(""); setFormFields([]); }}
                  className="text-sm text-primary font-medium hover:underline mb-4 inline-block"
                >
                  ← Choose a different event
                </button>
              )}
              <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 flex items-start gap-3">
                <span className="text-xl mt-0.5">🎯</span>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Registering for</p>
                  <p className="font-bold text-foreground text-base">{selectedEvent}</p>
                </div>
              </div>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="max-w-xl mx-auto bg-card rounded-2xl p-8 shadow-card"
            >
              <div className="space-y-4">
                {formFields.map((field) => (
                  <motion.div key={field.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {field.field_label} {field.is_required && <span className="text-destructive">*</span>}
                    </label>
                    {renderField(field)}
                  </motion.div>
                ))}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-hero-gradient text-primary-foreground py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:scale-[1.02] shadow-elevated disabled:opacity-50"
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit Registration"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default RegistrationSection;
