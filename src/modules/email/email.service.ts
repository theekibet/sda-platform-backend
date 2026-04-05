// src/modules/email/email.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private isConfigured: boolean = false;
  private smtpHost: string = '';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter() {
    const emailEnabled = this.configService.get('EMAIL_ENABLED', 'true') === 'true';
    if (!emailEnabled) {
      this.logger.warn('Email service is disabled via EMAIL_ENABLED=false');
      return;
    }

    let host = this.configService.get('SMTP_HOST');
    let port = parseInt(this.configService.get('SMTP_PORT', '587'));
    let user = this.configService.get('SMTP_USER');
    let pass = this.configService.get('SMTP_PASSWORD');
    let secure = this.configService.get('SMTP_SECURE', 'false') === 'true';

    // If no SMTP configuration, use ethereal.email for development
    if (!host || !user || !pass) {
      this.logger.log('No SMTP configuration found. Creating ethereal.email test account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        host = 'smtp.ethereal.email';
        port = 587;
        secure = false;
        user = testAccount.user;
        pass = testAccount.pass;
        this.smtpHost = host;
        
        this.logger.log('✅ Created ethereal.email test account');
        this.logger.log(`📧 Email: ${user}`);
        this.logger.log(`🔑 Password: ${pass}`);
        this.logger.log(`🔗 Preview emails at: https://ethereal.email/login`);
        this.logger.log(`   Login with the email and password above`);
      } catch (error) {
        this.logger.error(`Failed to create ethereal account: ${error.message}`);
        return;
      }
    } else {
      this.smtpHost = host;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      this.logger.log(`✅ Email service configured with SMTP host: ${host}`);
      this.logger.log(`📧 Using email: ${user}`);
    } catch (error) {
      this.logger.error(`Failed to configure email service: ${error.message}`);
      this.isConfigured = false;
    }
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<{ success: boolean; previewUrl?: string; message: string }> {
    if (!this.isConfigured) {
      this.logger.warn(`Email not sent to ${to} - email service not configured`);
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    this.logger.log(`📧 Sending password reset email to: ${to}`);
    this.logger.log(`🔗 Reset link: ${resetLink}`);
    
    const mailOptions = {
      from: this.configService.get('EMAIL_FROM', '"SDA Youth Connect" <noreply@sdaconnect.com>'),
      to,
      subject: 'Reset Your Password - SDA Youth Connect',
      html: this.getPasswordResetEmailTemplate(name, resetLink),
      text: this.getPasswordResetTextTemplate(name, resetLink),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent! Message ID: ${info.messageId}`);
      
      let previewUrl: string | undefined;
      
      // Get preview URL for ethereal.email
      const isEthereal = this.smtpHost.includes('ethereal.email');
      
      if (isEthereal) {
        const testUrl = nodemailer.getTestMessageUrl(info);
        previewUrl = testUrl || undefined;
        if (previewUrl) {
          this.logger.log(`📧 EMAIL PREVIEW URL: ${previewUrl}`);
          this.logger.log(`👉 Open this URL in your browser to view the email`);
        }
      }
      
      return {
        success: true,
        previewUrl,
        message: 'Email sent successfully',
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send email: ${error.message}`);
      return {
        success: false,
        message: 'Failed to send email',
      };
    }
  }

  // ✅ Add this missing method
  async sendNotificationEmail(to: string, name: string, title: string, message: string, link?: string): Promise<{ success: boolean; previewUrl?: string; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Email service not configured',
      };
    }

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM', '"SDA Youth Connect" <noreply@sdaconnect.com>'),
      to,
      subject: title,
      html: this.getNotificationEmailTemplate(name, title, message, link),
      text: this.getNotificationTextTemplate(name, title, message, link),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Notification email sent to: ${to}`);
      
      let previewUrl: string | undefined;
      const isEthereal = this.smtpHost.includes('ethereal.email');
      
      if (isEthereal) {
        const testUrl = nodemailer.getTestMessageUrl(info);
        previewUrl = testUrl || undefined;
        if (previewUrl) {
          this.logger.log(`📧 EMAIL PREVIEW URL: ${previewUrl}`);
        }
      }
      
      return {
        success: true,
        previewUrl,
        message: 'Email sent successfully',
      };
    } catch (error) {
      this.logger.error(`❌ Failed to send notification email: ${error.message}`);
      return {
        success: false,
        message: 'Failed to send email',
      };
    }
  }

  private getPasswordResetEmailTemplate(name: string, resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .button:hover {
            background: #5a6fd8;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SDA Youth Connect</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your SDA Youth Connect account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>⚠️ This link will expire in 1 hour.</strong><br>
              If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>SDA Youth Connect - Connecting Young Adventists Worldwide</p>
            <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTextTemplate(name: string, resetLink: string): string {
    return `
Hello ${name},

We received a request to reset your password for your SDA Youth Connect account.

Click the link below to create a new password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.

SDA Youth Connect Team
    `;
  }

  private getNotificationEmailTemplate(name: string, title: string, message: string, link?: string): string {
    const buttonHtml = link ? `
      <div style="text-align: center;">
        <a href="${link}" class="button">View Details</a>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 40px 30px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SDA Youth Connect</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>${message}</p>
            ${buttonHtml}
          </div>
          <div class="footer">
            <p>SDA Youth Connect - Connecting Young Adventists Worldwide</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getNotificationTextTemplate(name: string, title: string, message: string, link?: string): string {
    return `
Hello ${name},

${message}

${link ? `View details: ${link}` : ''}

SDA Youth Connect Team
    `;
  }
}