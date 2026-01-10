import * as ics from 'ics';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  attendees: Array<{ email: string; name?: string }>;
}

interface SendEmailResult {
  success: boolean;
  message: string;
}

/**
 * Generate ICS calendar file content
 */
function generateICSContent(event: CalendarEventData): string {
  const start = event.startDate;
  const end = event.endDate;

  const { value, error } = ics.createEvent({
    title: event.title,
    description: event.description,
    location: event.location,
    start: [
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
      start.getMinutes()
    ],
    end: [
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes()
    ],
    attendees: event.attendees.map(a => ({
      email: a.email,
      name: a.name,
      partstat: 'NEEDS-ACTION'
    }))
  });

  if (error) {
    console.error('ICS generation error:', error);
    return '';
  }

  return value || '';
}

/**
 * Send calendar invite email to parent using Resend
 * In development mode, email is logged to console
 */
export async function sendParentCalendarInvite(data: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  tokenId: string;
  slotDate: Date;
  slotStartTime: string;
  slotEndTime: string;
  location: string;
}): Promise<SendEmailResult> {
  const schoolName = process.env.SCHOOL_NAME || 'ABC International School';
  const schoolEmail = process.env.SCHOOL_EMAIL || 'info@school.com';

  // Parse time strings to create proper dates
  const [startHour, startMin] = data.slotStartTime.split(':').map(Number);
  const [endHour, endMin] = data.slotEndTime.split(':').map(Number);

  const startDate = new Date(data.slotDate);
  startDate.setHours(startHour, startMin, 0, 0);

  const endDate = new Date(data.slotDate);
  endDate.setHours(endHour, endMin, 0, 0);

  const event: CalendarEventData = {
    title: `Counselling Session - ${schoolName}`,
    description: `Student: ${data.studentName}\\nToken ID: ${data.tokenId}\\n\\nPlease bring all required documents.`,
    location: data.location,
    startDate,
    endDate,
    attendees: [{ email: data.parentEmail, name: data.parentName }]
  };

  const icsContent = generateICSContent(event);

  const emailBody = `
Dear ${data.parentName},

Your counselling session for ${data.studentName}'s admission has been scheduled.

Details:
- Token ID: ${data.tokenId}
- Date: ${data.slotDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${data.slotStartTime} - ${data.slotEndTime}
- Location: ${data.location}

Please bring all required documents for verification.

Best regards,
${schoolName} Admissions Team
  `.trim();

  if (process.env.NODE_ENV === 'development') {
    console.log('========================================');
    console.log('EMAIL SERVICE - PARENT INVITE (MOCK)');
    console.log('----------------------------------------');
    console.log(`To: ${data.parentEmail}`);
    console.log(`Subject: Counselling Slot Confirmation - ${data.tokenId}`);
    console.log('Body:');
    console.log(emailBody);
    console.log('----------------------------------------');
    console.log('ICS Content:');
    console.log(icsContent);
    console.log('========================================');

    return {
      success: true,
      message: 'Calendar invite email sent to parent (dev mode)'
    };
  }

  // Production: Use Resend
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `${schoolName} <${schoolEmail}>`,
      to: [data.parentEmail],
      subject: `Counselling Slot Confirmation - ${data.tokenId}`,
      text: emailBody,
      attachments: [
        {
          filename: 'counselling-session.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        message: `Failed to send email: ${error.message}`
      };
    }

    console.log('Email sent successfully via Resend:', emailData?.id);
    return {
      success: true,
      message: 'Calendar invite email sent to parent'
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`
    };
  }
}

/**
 * Send calendar invite email to principal using Resend
 */
export async function sendPrincipalCalendarInvite(data: {
  studentName: string;
  parentName: string;
  tokenId: string;
  slotDate: Date;
  slotStartTime: string;
  slotEndTime: string;
  location: string;
}): Promise<SendEmailResult> {
  const principalEmail = process.env.PRINCIPAL_EMAIL || 'principal@school.com';
  const schoolName = process.env.SCHOOL_NAME || 'ABC International School';
  const schoolEmail = process.env.SCHOOL_EMAIL || 'info@school.com';

  const [startHour, startMin] = data.slotStartTime.split(':').map(Number);
  const [endHour, endMin] = data.slotEndTime.split(':').map(Number);

  const startDate = new Date(data.slotDate);
  startDate.setHours(startHour, startMin, 0, 0);

  const endDate = new Date(data.slotDate);
  endDate.setHours(endHour, endMin, 0, 0);

  const event: CalendarEventData = {
    title: `Counselling: ${data.studentName} - ${data.tokenId}`,
    description: `Student: ${data.studentName}\\nParent: ${data.parentName}\\nToken ID: ${data.tokenId}`,
    location: data.location,
    startDate,
    endDate,
    attendees: [{ email: principalEmail, name: 'Principal' }]
  };

  const icsContent = generateICSContent(event);

  const emailBody = `
Counselling Session Scheduled

Student: ${data.studentName}
Parent: ${data.parentName}
Token ID: ${data.tokenId}
Date: ${data.slotDate.toLocaleDateString('en-IN')}
Time: ${data.slotStartTime} - ${data.slotEndTime}
Location: ${data.location}
  `.trim();

  if (process.env.NODE_ENV === 'development') {
    console.log('========================================');
    console.log('EMAIL SERVICE - PRINCIPAL INVITE (MOCK)');
    console.log('----------------------------------------');
    console.log(`To: ${principalEmail}`);
    console.log(`Subject: Counselling Session - ${data.slotStartTime} - ${data.studentName}`);
    console.log('Body:');
    console.log(emailBody);
    console.log('========================================');

    return {
      success: true,
      message: 'Calendar invite email sent to principal (dev mode)'
    };
  }

  // Production: Use Resend
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: `${schoolName} <${schoolEmail}>`,
      to: [principalEmail],
      subject: `Counselling Session - ${data.slotStartTime} - ${data.studentName}`,
      text: emailBody,
      attachments: [
        {
          filename: 'counselling-session.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        message: `Failed to send email: ${error.message}`
      };
    }

    console.log('Email sent successfully via Resend:', emailData?.id);
    return {
      success: true,
      message: 'Calendar invite email sent to principal'
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`
    };
  }
}
