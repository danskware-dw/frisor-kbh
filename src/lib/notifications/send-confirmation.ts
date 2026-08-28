import type { BookingResult } from "@/lib/booking/create-booking";
import { siteConfig } from "@/data/site";
import { sendEmail } from "./provider";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character
  );
}

function formatDateDanish(dateStr: string): string {
  // Noon avoids a date shift if the server and recipient use different zones.
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  }).format(date);
}

function buildConfirmationHtml(booking: BookingResult): string {
  const customerName = escapeHtml(booking.customerName);
  const treatmentName = escapeHtml(booking.treatmentName);
  const employeeName = escapeHtml(booking.employeeName);
  const date = escapeHtml(formatDateDanish(booking.date));
  const time = escapeHtml(booking.time);
  const price = escapeHtml(booking.priceLabel ?? "Oplyses i salonen");
  const bookingId = escapeHtml(booking.id);
  const phone = escapeHtml(siteConfig.contact.phone);
  const email = escapeHtml(siteConfig.contact.email);
  const address = escapeHtml(
    `${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}`
  );
  const directionsUrl = escapeHtml(
    siteConfig.contact.directionsUrl ?? siteConfig.url
  );

  return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Din booking er bekræftet</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Arial,'Helvetica Neue',sans-serif;color:#20201f;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Din tid hos FRISØR KBH er bekræftet.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f1ec;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e5dfd6;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:30px 32px;background:#171717;color:#ffffff;text-align:center;">
              <div style="font-size:22px;font-weight:700;letter-spacing:1.5px;">FRISØR KBH</div>
              <div style="margin-top:7px;font-size:13px;color:#d2d2d2;">${address}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 32px 16px;">
              <div style="display:inline-block;margin-bottom:18px;padding:7px 11px;border-radius:999px;background:#e9f7ef;color:#17633a;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">Booking bekræftet</div>
              <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#171717;">Vi glæder os til at se dig, ${customerName}</h1>
              <p style="margin:0;font-size:15px;line-height:1.65;color:#62605c;">Din tid er nu reserveret. Du behøver ikke foretage dig mere.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e8e3dc;border-radius:12px;background:#fbfaf8;">
                <tr>
                  <td style="padding:20px 22px 8px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#77736d;">Din aftale</td>
                </tr>
                <tr>
                  <td style="padding:4px 22px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:1.5;">
                      <tr><td style="padding:8px 0;color:#77736d;width:120px;">Behandling</td><td style="padding:8px 0;color:#171717;font-weight:600;">${treatmentName}</td></tr>
                      <tr><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#77736d;">Dato</td><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#171717;font-weight:600;">${date}</td></tr>
                      <tr><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#77736d;">Tid</td><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#171717;font-weight:600;">Kl. ${time}</td></tr>
                      <tr><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#77736d;">Frisør</td><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#171717;font-weight:600;">${employeeName}</td></tr>
                      <tr><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#77736d;">Pris</td><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#171717;font-weight:600;">${price}</td></tr>
                      <tr><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#77736d;">Adresse</td><td style="padding:8px 0;border-top:1px solid #ece7e0;color:#171717;font-weight:600;">${address}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 6px;">
              <h2 style="margin:0 0 8px;font-size:17px;color:#171717;">Inden du kommer</h2>
              <p style="margin:0;font-size:14px;line-height:1.65;color:#62605c;">Kom gerne 5 minutter før din tid. Der kræves ingen særlig forberedelse.</p>
              <p style="margin:16px 0 0;"><a href="${directionsUrl}" style="display:inline-block;padding:11px 16px;border-radius:8px;background:#171717;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Se rutevejledning</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;">
              <h2 style="margin:0 0 8px;font-size:17px;color:#171717;">Skal tiden ændres?</h2>
              <p style="margin:0;font-size:14px;line-height:1.65;color:#62605c;">Ring til os på <a href="tel:${phone.replace(/\s/g, "")}" style="color:#20201f;font-weight:700;">${phone}</a>, eller svar på denne e-mail. Kontakt os gerne så tidligt som muligt, hvis du vil flytte eller aflyse tiden.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f7f4ef;text-align:center;font-size:12px;line-height:1.7;color:#77736d;">
              Bookingnummer: ${bookingId}<br />
              ${siteConfig.businessName} · ${address} · <a href="mailto:${email}" style="color:#77736d;">${email}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildConfirmationText(booking: BookingResult): string {
  const address = `${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}`;

  return `Hej ${booking.customerName},

Din tid hos ${siteConfig.businessName} er bekræftet. Vi glæder os til at se dig.

DIN AFTALE
Behandling: ${booking.treatmentName}
Dato: ${formatDateDanish(booking.date)}
Tid: kl. ${booking.time}
Frisør: ${booking.employeeName}
Pris: ${booking.priceLabel ?? "Oplyses i salonen"}
Adresse: ${address}

Kom gerne 5 minutter før din tid. Der kræves ingen særlig forberedelse.

Skal tiden ændres eller aflyses? Ring til os på ${siteConfig.contact.phone}, eller svar på denne e-mail. Kontakt os gerne så tidligt som muligt.

Bookingnummer: ${booking.id}

Venlig hilsen
${siteConfig.businessName}`;
}

/** Send a booking confirmation email to the customer. */
export async function sendBookingConfirmation(
  booking: BookingResult
): Promise<void> {
  await sendEmail({
    to: booking.customerEmail,
    subject: `Din tid hos ${siteConfig.businessName} er bekræftet – ${formatDateDanish(booking.date)} kl. ${booking.time}`,
    html: buildConfirmationHtml(booking),
    text: buildConfirmationText(booking),
  });
}

function buildOwnerNotificationHtml(booking: BookingResult): string {
  const customerName = escapeHtml(booking.customerName);
  const customerEmail = escapeHtml(booking.customerEmail);
  const customerPhone = escapeHtml(booking.customerPhone);
  const treatmentName = escapeHtml(booking.treatmentName);
  const employeeName = escapeHtml(booking.employeeName);
  const date = escapeHtml(formatDateDanish(booking.date));
  const time = escapeHtml(booking.time);
  const price = escapeHtml(booking.priceLabel ?? "Oplyses i salonen");
  const bookingId = escapeHtml(booking.id);
  const notes = escapeHtml(booking.notes || "Ingen bemærkninger").replace(
    /\n/g,
    "<br />"
  );

  return `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ny booking</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ec;font-family:Arial,'Helvetica Neue',sans-serif;color:#20201f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f1ec;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e5dfd6;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:#171717;color:#ffffff;">
              <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#bdbdbd;">Ny online booking</div>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">${customerName} har booket en tid</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:1.5;">
                <tr><td style="padding:9px 0;color:#77736d;width:135px;">Behandling</td><td style="padding:9px 0;font-weight:600;">${treatmentName}</td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;">Dato</td><td style="padding:9px 0;border-top:1px solid #ece7e0;font-weight:600;">${date}</td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;">Tid</td><td style="padding:9px 0;border-top:1px solid #ece7e0;font-weight:600;">Kl. ${time}</td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;">Frisør</td><td style="padding:9px 0;border-top:1px solid #ece7e0;font-weight:600;">${employeeName}</td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;">Pris</td><td style="padding:9px 0;border-top:1px solid #ece7e0;font-weight:600;">${price}</td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;">Kunde</td><td style="padding:9px 0;border-top:1px solid #ece7e0;font-weight:600;">${customerName}</td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;">Telefon</td><td style="padding:9px 0;border-top:1px solid #ece7e0;"><a href="tel:${customerPhone.replace(/\s/g, "")}" style="color:#20201f;font-weight:600;">${customerPhone}</a></td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;">E-mail</td><td style="padding:9px 0;border-top:1px solid #ece7e0;"><a href="mailto:${customerEmail}" style="color:#20201f;font-weight:600;">${customerEmail}</a></td></tr>
                <tr><td style="padding:9px 0;border-top:1px solid #ece7e0;color:#77736d;vertical-align:top;">Bemærkning</td><td style="padding:9px 0;border-top:1px solid #ece7e0;">${notes}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f7f4ef;font-size:12px;color:#77736d;">Bookingnummer: ${bookingId}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOwnerNotificationText(booking: BookingResult): string {
  return `Ny online booking

${booking.customerName} har booket en tid.

Behandling: ${booking.treatmentName}
Dato: ${formatDateDanish(booking.date)}
Tid: kl. ${booking.time}
Frisør: ${booking.employeeName}
Pris: ${booking.priceLabel ?? "Oplyses i salonen"}

Kunde: ${booking.customerName}
Telefon: ${booking.customerPhone}
E-mail: ${booking.customerEmail}
Bemærkning: ${booking.notes || "Ingen bemærkninger"}

Bookingnummer: ${booking.id}`;
}

/** Notify the salon when a customer creates a booking. */
export async function sendOwnerBookingNotification(
  booking: BookingResult
): Promise<void> {
  await sendEmail({
    to: process.env.BOOKING_NOTIFICATION_EMAIL || "kbhfrisor@gmail.com",
    replyTo: booking.customerEmail,
    subject: `Ny booking: ${booking.customerName} – ${formatDateDanish(booking.date)} kl. ${booking.time}`,
    html: buildOwnerNotificationHtml(booking),
    text: buildOwnerNotificationText(booking),
  });
}
