import { supabase } from '../supabaseClient';
import { smsService } from './smsService';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface InvoiceItem {
  lr_number: string;
  booking_date: string;
  from_station: string;
  to_station: string;
  articles: number;
  weight: number;
  freight: number;
  loading_charges: number;
  unloading_charges: number;
  insurance: number;
  other_charges: number;
  total_amount: number;
}

export interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_address: string;
  customer_gstin?: string;
  customer_phone: string;
  customer_email?: string;
  from_date: string;
  to_date: string;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
  grand_total: number;
  organization_name: string;
  organization_address: string;
  organization_gstin: string;
  organization_phone: string;
  organization_email: string;
  branch_name: string;
  branch_address: string;
}

export interface InvoiceFilters {
  customer_id: string;
  from_date: string;
  to_date: string;
  branch_id?: string;
  organization_id: string;
  include_delivered_only?: boolean;
  include_paid_bookings?: boolean;
}

class InvoiceService {
  
  // Generate invoice number
  private generateInvoiceNumber(branchCode: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${branchCode}-${year}${month}-${timestamp}`;
  }

  // Calculate GST based on interstate or intrastate
  private calculateGST(amount: number, fromState: string, toState: string) {
    const gstRate = 0.18; // 18% GST for transport services
    const gstAmount = amount * gstRate;
    
    if (fromState === toState) {
      // Intrastate - CGST + SGST
      return {
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
        total_tax: gstAmount
      };
    } else {
      // Interstate - IGST
      return {
        cgst: 0,
        sgst: 0,
        igst: gstAmount,
        total_tax: gstAmount
      };
    }
  }

  // Get customer bookings for invoice compilation
  async getCustomerBookingsForInvoice(filters: InvoiceFilters): Promise<any[]> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:customers(*),
          from_station:stations!bookings_from_station_id_fkey(*),
          to_station:stations!bookings_to_station_id_fkey(*),
          articles(*),
          billing_details(*)
        `)
        .eq('organization_id', filters.organization_id)
        .eq('customer_id', filters.customer_id)
        .gte('booking_date', filters.from_date)
        .lte('booking_date', filters.to_date);

      if (filters.branch_id) {
        query = query.eq('branch_id', filters.branch_id);
      }

      if (filters.include_delivered_only) {
        query = query.eq('status', 'delivered');
      }

      if (!filters.include_paid_bookings) {
        query = query.neq('payment_status', 'paid');
      }

      const { data, error } = await query.order('booking_date', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch bookings: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      throw error;
    }
  }

  // Compile invoice data from bookings
  async compileInvoiceData(filters: InvoiceFilters): Promise<InvoiceData> {
    try {
      // Fetch bookings
      const bookings = await this.getCustomerBookingsForInvoice(filters);
      
      if (bookings.length === 0) {
        throw new Error('No bookings found for the specified criteria');
      }

      // Get customer details
      const customer = bookings[0].customer;
      if (!customer) {
        throw new Error('Customer details not found');
      }

      // Get organization and branch details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', filters.organization_id)
        .single();

      const { data: branchData } = await supabase
        .from('branches')
        .select('*')
        .eq('id', filters.branch_id)
        .single();

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber(branchData?.code || 'BR');

      // Process booking items
      const items: InvoiceItem[] = bookings.map(booking => {
        const billing = booking.billing_details?.[0] || {};
        const articlesCount = booking.articles?.length || 0;
        const totalWeight = booking.articles?.reduce((sum: number, article: any) => sum + (article.weight || 0), 0) || 0;

        return {
          lr_number: booking.lr_number,
          booking_date: booking.booking_date,
          from_station: booking.from_station?.name || '',
          to_station: booking.to_station?.name || '',
          articles: articlesCount,
          weight: totalWeight,
          freight: billing.freight_amount || 0,
          loading_charges: billing.loading_charges || 0,
          unloading_charges: billing.unloading_charges || 0,
          insurance: billing.insurance_amount || 0,
          other_charges: billing.other_charges || 0,
          total_amount: billing.total_amount || 0
        };
      });

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.total_amount, 0);
      
      // Determine GST calculation (using first booking's states)
      const fromState = bookings[0].from_station?.state || '';
      const toState = bookings[0].to_station?.state || '';
      const gstDetails = this.calculateGST(subtotal, fromState, toState);

      const invoiceData: InvoiceData = {
        invoice_number: invoiceNumber,
        customer_name: customer.name,
        customer_address: `${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} - ${customer.pincode || ''}`.trim(),
        customer_gstin: customer.gstin,
        customer_phone: customer.mobile,
        customer_email: customer.email,
        from_date: filters.from_date,
        to_date: filters.to_date,
        items,
        subtotal,
        cgst: gstDetails.cgst,
        sgst: gstDetails.sgst,
        igst: gstDetails.igst,
        total_tax: gstDetails.total_tax,
        grand_total: subtotal + gstDetails.total_tax,
        organization_name: orgData?.name || 'DesiCargo',
        organization_address: orgData?.address || '',
        organization_gstin: orgData?.gstin || '',
        organization_phone: orgData?.phone || '',
        organization_email: orgData?.email || '',
        branch_name: branchData?.name || '',
        branch_address: branchData?.address || ''
      };

      return invoiceData;
    } catch (error) {
      console.error('Error compiling invoice data:', error);
      throw error;
    }
  }

  // Generate PDF invoice
  async generatePDFInvoice(invoiceData: InvoiceData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create invoices directory if it doesn't exist
        const invoicesDir = path.join(process.cwd(), 'invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const fileName = `${invoiceData.invoice_number}.pdf`;
        const filePath = path.join(invoicesDir, fileName);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('TAX INVOICE', 50, 50);
        
        // Company details (left side)
        doc.fontSize(12).font('Helvetica-Bold').text(invoiceData.organization_name, 50, 100);
        doc.fontSize(10).font('Helvetica').text(invoiceData.organization_address, 50, 120);
        doc.text(`GSTIN: ${invoiceData.organization_gstin}`, 50, 160);
        doc.text(`Phone: ${invoiceData.organization_phone}`, 50, 175);
        doc.text(`Email: ${invoiceData.organization_email}`, 50, 190);

        // Invoice details (right side)
        doc.font('Helvetica-Bold').text('Invoice No:', 350, 100);
        doc.font('Helvetica').text(invoiceData.invoice_number, 420, 100);
        doc.font('Helvetica-Bold').text('Date:', 350, 120);
        doc.font('Helvetica').text(new Date().toLocaleDateString('en-IN'), 420, 120);
        doc.font('Helvetica-Bold').text('Period:', 350, 140);
        doc.font('Helvetica').text(`${new Date(invoiceData.from_date).toLocaleDateString('en-IN')} to ${new Date(invoiceData.to_date).toLocaleDateString('en-IN')}`, 420, 140);

        // Customer details
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 230);
        doc.fontSize(10).font('Helvetica-Bold').text(invoiceData.customer_name, 50, 250);
        doc.font('Helvetica').text(invoiceData.customer_address, 50, 265);
        if (invoiceData.customer_gstin) {
          doc.text(`GSTIN: ${invoiceData.customer_gstin}`, 50, 295);
        }
        doc.text(`Phone: ${invoiceData.customer_phone}`, 50, 310);
        if (invoiceData.customer_email) {
          doc.text(`Email: ${invoiceData.customer_email}`, 50, 325);
        }

        // Line separator
        doc.moveTo(50, 360).lineTo(550, 360).stroke();

        // Table headers
        const tableTop = 380;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('LR No.', 50, tableTop);
        doc.text('Date', 110, tableTop);
        doc.text('From-To', 160, tableTop);
        doc.text('Articles', 240, tableTop);
        doc.text('Weight', 280, tableTop);
        doc.text('Freight', 320, tableTop);
        doc.text('Other', 370, tableTop);
        doc.text('Total', 420, tableTop);

        // Line under headers
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table rows
        let yPosition = tableTop + 25;
        doc.font('Helvetica').fontSize(8);

        invoiceData.items.forEach((item, index) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.text(item.lr_number, 50, yPosition);
          doc.text(new Date(item.booking_date).toLocaleDateString('en-IN'), 110, yPosition);
          doc.text(`${item.from_station.substring(0, 8)}-${item.to_station.substring(0, 8)}`, 160, yPosition);
          doc.text(item.articles.toString(), 240, yPosition);
          doc.text(`${item.weight.toFixed(1)}`, 280, yPosition);
          doc.text(`₹${item.freight.toFixed(2)}`, 320, yPosition);
          doc.text(`₹${(item.loading_charges + item.unloading_charges + item.insurance + item.other_charges).toFixed(2)}`, 370, yPosition);
          doc.text(`₹${item.total_amount.toFixed(2)}`, 420, yPosition);

          yPosition += 20;
        });

        // Totals section
        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 15;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Subtotal:', 370, yPosition);
        doc.text(`₹${invoiceData.subtotal.toFixed(2)}`, 450, yPosition);
        yPosition += 20;

        if (invoiceData.cgst > 0) {
          doc.text('CGST (9%):', 370, yPosition);
          doc.text(`₹${invoiceData.cgst.toFixed(2)}`, 450, yPosition);
          yPosition += 15;
          
          doc.text('SGST (9%):', 370, yPosition);
          doc.text(`₹${invoiceData.sgst.toFixed(2)}`, 450, yPosition);
          yPosition += 15;
        }

        if (invoiceData.igst > 0) {
          doc.text('IGST (18%):', 370, yPosition);
          doc.text(`₹${invoiceData.igst.toFixed(2)}`, 450, yPosition);
          yPosition += 15;
        }

        doc.fontSize(12);
        doc.text('Grand Total:', 370, yPosition);
        doc.text(`₹${invoiceData.grand_total.toFixed(2)}`, 450, yPosition);

        // Footer
        yPosition += 50;
        doc.fontSize(8).font('Helvetica');
        doc.text('This is a computer generated invoice and does not require signature.', 50, yPosition);
        doc.text('Thank you for choosing DesiCargo for your logistics needs.', 50, yPosition + 15);

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Save invoice to database
  async saveInvoiceToDatabase(invoiceData: InvoiceData, pdfPath: string, filters: InvoiceFilters): Promise<string> {
    try {
      // Insert invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceData.invoice_number,
          customer_id: filters.customer_id,
          organization_id: filters.organization_id,
          branch_id: filters.branch_id,
          from_date: filters.from_date,
          to_date: filters.to_date,
          subtotal: invoiceData.subtotal,
          cgst: invoiceData.cgst,
          sgst: invoiceData.sgst,
          igst: invoiceData.igst,
          total_tax: invoiceData.total_tax,
          grand_total: invoiceData.grand_total,
          status: 'generated',
          pdf_path: pdfPath,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) {
        throw new Error(`Failed to save invoice: ${invoiceError.message}`);
      }

      // Insert invoice items
      const invoiceItems = invoiceData.items.map(item => ({
        invoice_id: invoice.id,
        lr_number: item.lr_number,
        booking_date: item.booking_date,
        from_station: item.from_station,
        to_station: item.to_station,
        articles_count: item.articles,
        weight: item.weight,
        freight_amount: item.freight,
        loading_charges: item.loading_charges,
        unloading_charges: item.unloading_charges,
        insurance_amount: item.insurance,
        other_charges: item.other_charges,
        total_amount: item.total_amount
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        throw new Error(`Failed to save invoice items: ${itemsError.message}`);
      }

      return invoice.id;
    } catch (error) {
      console.error('Error saving invoice to database:', error);
      throw error;
    }
  }

  // Send invoice via SMS and Email
  async sendInvoice(invoiceData: InvoiceData, pdfPath: string): Promise<void> {
    try {
      // Send SMS notification
      const smsMessage = `Dear ${invoiceData.customer_name}, your invoice ${invoiceData.invoice_number} for ₹${invoiceData.grand_total.toFixed(2)} has been generated. Total bookings: ${invoiceData.items.length}. Period: ${new Date(invoiceData.from_date).toLocaleDateString('en-IN')} to ${new Date(invoiceData.to_date).toLocaleDateString('en-IN')}. Download: [link]`;
      
      await smsService.sendSMS(invoiceData.customer_phone, smsMessage);

      // Log notification
      
      // TODO: Implement email sending with PDF attachment
      // This would require email service integration
      
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  // Main function to generate complete invoice
  async generateInvoice(filters: InvoiceFilters): Promise<{
    invoice_id: string;
    invoice_number: string;
    pdf_path: string;
    grand_total: number;
  }> {
    try {

      // 1. Compile invoice data
      const invoiceData = await this.compileInvoiceData(filters);

      // 2. Generate PDF
      const pdfPath = await this.generatePDFInvoice(invoiceData);

      // 3. Save to database
      const invoiceId = await this.saveInvoiceToDatabase(invoiceData, pdfPath, filters);

      // 4. Send notifications
      await this.sendInvoice(invoiceData, pdfPath);

      return {
        invoice_id: invoiceId,
        invoice_number: invoiceData.invoice_number,
        pdf_path: pdfPath,
        grand_total: invoiceData.grand_total
      };

    } catch (error) {
      console.error('Error in invoice generation process:', error);
      throw error;
    }
  }

  // Get invoice history for a customer
  async getCustomerInvoices(customerId: string, organizationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*),
          invoice_items(*)
        `)
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();