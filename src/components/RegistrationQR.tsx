import { QRCodeSVG } from "qrcode.react";

interface RegistrationQRProps {
  data: {
    name: string;
    email: string;
    phone?: string;
    organization?: string;
    event: string;
    id: string;
  };
  size?: number;
}

const RegistrationQR = ({ data, size = 200 }: RegistrationQRProps) => {
  const qrValue = JSON.stringify({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    organization: data.organization || "",
    event: data.event,
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <QRCodeSVG value={qrValue} size={size} level="M" />
      </div>
      <p className="text-xs text-muted-foreground text-center">Scan this QR at the event for check-in</p>
    </div>
  );
};

export default RegistrationQR;
