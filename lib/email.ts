import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@foodreels.local'
const FROM_EMAIL = 'noreply@foodreels.app'

export async function sendNewSubmissionNotification(
  restaurantName: string,
  creatorName: string,
  instagramUrl: string,
  submissionId: string
) {
  try {
    console.log('[v0] Sending new submission notification email...')
    
    const adminDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Reel Submission: ${restaurantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">New Reel Submission</h2>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Restaurant:</strong> ${restaurantName}</p>
            <p><strong>Creator:</strong> ${creatorName}</p>
            <p><strong>Instagram Reel:</strong> <a href="${instagramUrl}" target="_blank">${instagramUrl}</a></p>
          </div>
          
          <p style="margin: 20px 0;">
            <a href="${adminDashboardUrl}" style="background: #ff6b35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Submission
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from FoodReels. Please review and approve/reject the submission in the admin dashboard.
          </p>
        </div>
      `,
    })
    
    console.log('[v0] Notification email sent successfully')
  } catch (error) {
    console.error('[v0] Failed to send notification email:', error)
    // Don't throw - email failure shouldn't break the submission
  }
}

export async function sendApprovalEmail(
  restaurantName: string,
  creatorEmail?: string
) {
  try {
    if (!creatorEmail) return
    
    console.log('[v0] Sending approval confirmation email...')
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: `Your Reel Has Been Approved!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Reel Approved!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Great news! Your reel for <strong>${restaurantName}</strong> has been approved and is now live on FoodReels.
          </p>
          
          <p style="margin: 20px 0;">
            Your reel will now appear in search results and help food enthusiasts discover ${restaurantName}.
          </p>
          
          <p style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: #ff6b35; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View on FoodReels
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for sharing your content with the FoodReels community!
          </p>
        </div>
      `,
    })
    
    console.log('[v0] Approval email sent successfully')
  } catch (error) {
    console.error('[v0] Failed to send approval email:', error)
  }
}

export async function sendRejectionEmail(
  restaurantName: string,
  reason: string,
  creatorEmail?: string
) {
  try {
    if (!creatorEmail) return
    
    console.log('[v0] Sending rejection notification email...')
    
    await resend.emails.send({
      from: FROM_EMAIL,
      to: creatorEmail,
      subject: `Update on Your Reel Submission`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Reel Status Update</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for submitting your reel for <strong>${restaurantName}</strong> to FoodReels.
          </p>
          
          <p style="margin: 20px 0; padding: 15px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
            <strong>Reason:</strong> ${reason}
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Please feel free to submit another reel that meets our guidelines. We look forward to your next submission!
          </p>
        </div>
      `,
    })
    
    console.log('[v0] Rejection email sent successfully')
  } catch (error) {
    console.error('[v0] Failed to send rejection email:', error)
  }
}
