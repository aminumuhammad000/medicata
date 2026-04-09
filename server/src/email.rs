use lettre::{
    message::header::ContentType,
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
};
use crate::config::Config;
use anyhow::Result;

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

    pub async fn send_verification_email(&self, to_email: &str, code: &str) -> Result<()> {
        let email = Message::builder()
            .from("Medicata <uteach38@gmail.com>".parse()?)
            .to(to_email.parse()?)
            .subject("Medicata Verification Code")
            .header(ContentType::TEXT_PLAIN)
            .body(format!(
                "Your verification code is: {}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.",
                code
            ))?;

        let creds = Credentials::new(self.smtp_username.clone(), self.smtp_password.clone());

        let mailer = SmtpTransport::relay(&self.smtp_host)?
            .credentials(creds)
            .port(self.smtp_port)
            .build();

        mailer.send(&email)?;

        Ok(())
    }

    pub async fn send_password_reset_email(&self, to_email: &str, code: &str) -> Result<()> {
        let email = Message::builder()
            .from("Medicata <uteach38@gmail.com>".parse()?)
            .to(to_email.parse()?)
            .subject("Medicata Password Reset")
            .header(ContentType::TEXT_PLAIN)
            .body(format!(
                "Your password reset code is: {}\n\nThis code will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.",
                code
            ))?;

        let creds = Credentials::new(self.smtp_username.clone(), self.smtp_password.clone());

        let mailer = SmtpTransport::relay(&self.smtp_host)?
            .credentials(creds)
            .port(self.smtp_port)
            .build();

        mailer.send(&email)?;

        Ok(())
    }
}
