use lettre::{
    message::header::ContentType,
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
};
use crate::config::Config;
use anyhow::Result;

#[derive(Clone)]
pub struct EmailService {
    smtp_username: String,
    smtp_password: String,
    smtp_host: String,
    smtp_port: u16,
}

impl EmailService {
    pub fn new(config: &Config) -> Self {
        EmailService {
            smtp_username: config.smtp_username.clone(),
            smtp_password: config.smtp_password.clone(),
            smtp_host: config.smtp_host.clone(),
            smtp_port: config.smtp_port,
        }
    }

    fn get_email_template(&self, title: &str, content: &str) -> String {
        format!(
            r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #4a90e2 0%, #5e60ce 100%); padding: 40px 20px; text-align: center; }}
        .header h1 {{ color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }}
        .content {{ padding: 40px 30px; }}
        .code-box {{ background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
        .code {{ font-size: 32px; font-weight: bold; color: #4a90e2; letter-spacing: 4px; }}
        .button {{ display: inline-block; background-color: #4a90e2; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
        .footer {{ background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }}
        .divider {{ border-top: 1px solid #e0e0e0; margin: 30px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{}</h1>
        </div>
        <div class="content">
            {}
        </div>
        <div class="footer">
            <p>&copy; 2024 Medicata. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>"#,
            title, title, content
        )
    }

    pub async fn send_verification_email(&self, to_email: &str, code: &str) -> Result<()> {
        println!("Attempting to send verification email to: {}", to_email);
        
        let html_content = self.get_email_template(
            "Verify Your Email",
            &format!(
                r#"<p>Hi there,</p>
                <p>Thank you for signing up with Medicata. To complete your registration, please use the verification code below:</p>
                <div class="code-box">
                    <div class="code">{}</div>
                </div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you didn't request this code, you can safely ignore this email.</p>"#,
                code
            )
        );
        
        let email = Message::builder()
            .from("Medicata <uteach38@gmail.com>".parse()?)
            .to(to_email.parse()?)
            .subject("Medicata Verification Code")
            .header(ContentType::TEXT_HTML)
            .body(html_content)?;

        let creds = Credentials::new(self.smtp_username.clone(), self.smtp_password.clone());

        let mailer = SmtpTransport::starttls_relay(&self.smtp_host)?
            .credentials(creds)
            .port(self.smtp_port)
            .build();

        match mailer.send(&email) {
            Ok(_) => println!("Verification email sent successfully to: {}", to_email),
            Err(e) => println!("Failed to send verification email to {}: {:?}", to_email, e),
        }

        Ok(())
    }

    pub async fn send_password_reset_email(&self, to_email: &str, code: &str) -> Result<()> {
        println!("Attempting to send password reset email to: {}", to_email);

        let html_content = self.get_email_template(
            "Reset Your Password",
            &format!(
                r#"<p>Hi there,</p>
                <p>We received a request to reset your Medicata password. Use the code below to complete the process:</p>
                <div class="code-box">
                    <div class="code">{}</div>
                </div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you didn't request a password reset, you can safely ignore this email. Your account is secure.</p>"#,
                code
            )
        );

        let email = Message::builder()
            .from("Medicata <uteach38@gmail.com>".parse()?)
            .to(to_email.parse()?)
            .subject("Medicata Password Reset")
            .header(ContentType::TEXT_HTML)
            .body(html_content)?;

        let creds = Credentials::new(self.smtp_username.clone(), self.smtp_password.clone());

        let mailer = SmtpTransport::starttls_relay(&self.smtp_host)?
            .credentials(creds)
            .port(self.smtp_port)
            .build();

        match mailer.send(&email) {
            Ok(_) => println!("Password reset email sent successfully to: {}", to_email),
            Err(e) => {
                println!("CRITICAL: Failed to send password reset email to {}: {:?}", to_email, e);
                return Err(anyhow::anyhow!("SMTP Error: {:?}", e));
            }
        }

        Ok(())
    }

    pub async fn send_appointment_notification_to_doctor(&self, to_email: &str, patient_name: &str, scheduled_at: &str, reason: &str) -> Result<()> {
        println!("Attempting to send appointment notification to doctor: {}", to_email);

        let html_content = self.get_email_template(
            "New Appointment Request",
            &format!(
                r#"<p>Dear Doctor,</p>
                <p>You have a <strong>new appointment request</strong> from a patient.</p>
                <div class="divider"></div>
                <h3>Appointment Details</h3>
                <p><strong>Patient:</strong> {}</p>
                <p><strong>Date/Time:</strong> {}</p>
                <p><strong>Reason:</strong> {}</p>
                <div class="divider"></div>
                <p>Please log in to your Medicata dashboard to approve or reject this appointment.</p>
                <a href="https://medicata.com/dashboard" class="button">View Dashboard</a>"#,
                patient_name, scheduled_at, reason
            )
        );

        let email = Message::builder()
            .from("Medicata <uteach38@gmail.com>".parse()?)
            .to(to_email.parse()?)
            .subject("New Appointment Request - Medicata")
            .header(ContentType::TEXT_HTML)
            .body(html_content)?;

        let creds = Credentials::new(self.smtp_username.clone(), self.smtp_password.clone());

        let mailer = SmtpTransport::starttls_relay(&self.smtp_host)?
            .credentials(creds)
            .port(self.smtp_port)
            .build();

        match mailer.send(&email) {
            Ok(_) => println!("Appointment notification sent successfully to doctor: {}", to_email),
            Err(e) => println!("Failed to send appointment notification to doctor {}: {:?}", to_email, e),
        }

        Ok(())
    }

    pub async fn send_appointment_status_notification_to_patient(&self, to_email: &str, status: &str, doctor_name: &str, scheduled_at: &str, cancellation_reason: Option<&str>) -> Result<()> {
        println!("Attempting to send appointment status notification to patient: {}", to_email);

        let status_message = match status.to_lowercase().as_str() {
            "accepted" | "approved" => "Your appointment has been APPROVED",
            "rejected" | "declined" => "Your appointment has been REJECTED",
            "completed" => "Your appointment has been marked as COMPLETED",
            "cancelled" | "canceled" => "Your appointment has been CANCELLED",
            _ => &format!("Your appointment status has been updated to: {}", status),
        };


        let status_class = match status.to_lowercase().as_str() {
            "accepted" | "approved" => "color: #22c55e;",
            "rejected" | "declined" | "cancelled" | "canceled" => "color: #ef4444;",
            _ => "color: #4a90e2;",
        };

        let html_content = self.get_email_template(
            "Appointment Update",
            &format!(
                r#"<p>Dear Patient,</p>
                <p style="font-size: 18px; {}"><strong>{}</strong></p>
                <div class="divider"></div>
                <h3>Appointment Details</h3>
                <p><strong>Doctor:</strong> {}</p>
                <p><strong>Date/Time:</strong> {}</p>
                {}
                <div class="divider"></div>
                <p>If you have any questions, please contact us or log in to your Medicata account.</p>
                <a href="https://medicata.com/dashboard" class="button">View Account</a>"#,
                status_class, status_message, doctor_name, scheduled_at,
                if let Some(reason) = cancellation_reason {
                    format!("<p><strong>Reason:</strong> {}</p>", reason)
                } else { String::new() }
            )
        );

        let email = Message::builder()
            .from("Medicata <uteach38@gmail.com>".parse()?)
            .to(to_email.parse()?)
            .subject("Appointment Update - Medicata")
            .header(ContentType::TEXT_HTML)
            .body(html_content)?;

        let creds = Credentials::new(self.smtp_username.clone(), self.smtp_password.clone());

        let mailer = SmtpTransport::starttls_relay(&self.smtp_host)?
            .credentials(creds)
            .port(self.smtp_port)
            .build();

        match mailer.send(&email) {
            Ok(_) => println!("Appointment status notification sent successfully to patient: {}", to_email),
            Err(e) => println!("Failed to send appointment status notification to patient {}: {:?}", to_email, e),
        }

        Ok(())
    }
}
