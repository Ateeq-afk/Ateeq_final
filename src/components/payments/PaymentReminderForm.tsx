import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Mail, Phone, FileText, Send } from 'lucide-react';
import { useCreatePaymentReminder } from '../../hooks/usePayments';
import { OutstandingAmount } from '../../services/payments';

const reminderSchema = z.object({
  reminder_type: z.enum(['email', 'sms', 'call', 'letter']),
  reminder_level: z.number().min(1).max(10),
  scheduled_date: z.string().min(1, 'Scheduled date is required'),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface PaymentReminderFormProps {
  outstandingAmount: OutstandingAmount;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PaymentReminderForm: React.FC<PaymentReminderFormProps> = ({
  outstandingAmount,
  onSuccess,
  onCancel,
}) => {
  const createReminderMutation = useCreatePaymentReminder();
  const [selectedType, setSelectedType] = useState<string>('email');

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      reminder_type: 'email',
      reminder_level: 1,
      scheduled_date: new Date().toISOString().split('T')[0],
      subject: '',
      message: '',
    },
  });

  const reminderTemplates = {
    email: {
      subject: `Payment Reminder - ${outstandingAmount.reference_number}`,
      message: `Dear ${outstandingAmount.customer_name},

This is a friendly reminder that we have an outstanding payment against ${outstandingAmount.reference_type} ${outstandingAmount.reference_number}.

Details:
- Original Amount: ₹${outstandingAmount.original_amount.toLocaleString('en-IN')}
- Paid Amount: ₹${outstandingAmount.paid_amount.toLocaleString('en-IN')}
- Outstanding Amount: ₹${outstandingAmount.outstanding_amount.toLocaleString('en-IN')}
- Due Date: ${new Date(outstandingAmount.due_date).toLocaleDateString('en-IN')}
- Days Overdue: ${outstandingAmount.overdue_days} days

We request you to kindly arrange the payment at the earliest to avoid any inconvenience.

For any queries, please contact us.

Thank you for your cooperation.

Best Regards,
DesiCargo Team`,
    },
    sms: {
      message: `Payment Reminder: Outstanding amount of ₹${outstandingAmount.outstanding_amount.toLocaleString('en-IN')} for ${outstandingAmount.reference_number} is overdue by ${outstandingAmount.overdue_days} days. Please arrange payment. -DesiCargo`,
    },
    call: {
      message: `Call script for payment reminder:

1. Introduce yourself and company
2. Mention the outstanding amount: ₹${outstandingAmount.outstanding_amount.toLocaleString('en-IN')}
3. Reference: ${outstandingAmount.reference_number}
4. Days overdue: ${outstandingAmount.overdue_days}
5. Request for payment timeline
6. Offer assistance if any issues
7. Follow up date if needed

Notes: Be polite and understanding. Document customer response.`,
    },
    letter: {
      message: `PAYMENT REMINDER NOTICE

Date: ${new Date().toLocaleDateString('en-IN')}

To: ${outstandingAmount.customer_name}

Subject: Outstanding Payment Reminder

Dear Sir/Madam,

We would like to bring to your attention that there is an outstanding amount pending against your account.

Details:
Reference: ${outstandingAmount.reference_number}
Type: ${outstandingAmount.reference_type}
Original Amount: ₹${outstandingAmount.original_amount.toLocaleString('en-IN')}
Paid Amount: ₹${outstandingAmount.paid_amount.toLocaleString('en-IN')}
Outstanding Amount: ₹${outstandingAmount.outstanding_amount.toLocaleString('en-IN')}
Due Date: ${new Date(outstandingAmount.due_date).toLocaleDateString('en-IN')}
Overdue Days: ${outstandingAmount.overdue_days}

We kindly request you to settle the outstanding amount at the earliest to maintain good business relations.

If you have already made the payment, please share the payment details for our records.

For any clarification, please contact us.

Thank you for your cooperation.

Sincerely,
DesiCargo Team`,
    },
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const template = reminderTemplates[type as keyof typeof reminderTemplates];
    
    if (template) {
      if ('subject' in template) {
        form.setValue('subject', template.subject);
      }
      form.setValue('message', template.message);
    }
  };

  const onSubmit = async (data: ReminderFormData) => {
    try {
      await createReminderMutation.mutateAsync({
        outstanding_id: outstandingAmount.id,
        ...data,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error creating payment reminder:', error);
    }
  };

  const getReminderIcon = (type: string) => {
    const icons = {
      email: Mail,
      sms: Phone,
      call: Phone,
      letter: FileText,
    };
    const Icon = icons[type as keyof typeof icons] || Mail;
    return <Icon className="h-4 w-4" />;
  };

  const getReminderColor = (level: number) => {
    if (level === 1) return 'bg-green-100 text-green-800';
    if (level <= 3) return 'bg-yellow-100 text-yellow-800';
    if (level <= 5) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Payment Reminder</CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Customer: <strong>{outstandingAmount.customer_name}</strong></span>
            <span>Amount: <strong>₹{outstandingAmount.outstanding_amount.toLocaleString('en-IN')}</strong></span>
            <Badge variant="destructive">
              {outstandingAmount.overdue_days} days overdue
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminder_type">Reminder Type *</Label>
                <Select
                  value={form.watch('reminder_type')}
                  onValueChange={(value) => {
                    form.setValue('reminder_type', value as any);
                    handleTypeChange(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="call">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Call
                      </div>
                    </SelectItem>
                    <SelectItem value="letter">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Letter
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder_level">Reminder Level *</Label>
                <Select
                  value={form.watch('reminder_level').toString()}
                  onValueChange={(value) => form.setValue('reminder_level', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${getReminderColor(level)}`}>
                            {level === 1 ? 'First' : 
                             level === 2 ? 'Second' :
                             level === 3 ? 'Third' :
                             `${level}th`} Reminder
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  {...form.register('scheduled_date')}
                />
                {form.formState.errors.scheduled_date && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.scheduled_date.message}
                  </p>
                )}
              </div>
            </div>

            {(selectedType === 'email' || selectedType === 'letter') && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  {...form.register('subject')}
                  placeholder="Enter subject line"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">
                Message *
                <span className="text-sm text-gray-500 ml-2">
                  ({selectedType === 'sms' ? 'SMS' : 
                    selectedType === 'call' ? 'Call Script' :
                    selectedType === 'letter' ? 'Letter Content' : 'Email Body'})
                </span>
              </Label>
              <Textarea
                id="message"
                {...form.register('message')}
                placeholder={`Enter ${selectedType} content...`}
                rows={selectedType === 'sms' ? 4 : 12}
                className="font-mono text-sm"
              />
              {form.formState.errors.message && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.message.message}
                </p>
              )}
              
              {selectedType === 'sms' && (
                <div className="text-sm text-gray-500">
                  Character count: {form.watch('message')?.length || 0}/160
                  {(form.watch('message')?.length || 0) > 160 && (
                    <span className="text-red-500 ml-2">
                      Message will be sent as multiple SMS
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createReminderMutation.isPending}
                className="flex items-center gap-2"
              >
                {getReminderIcon(selectedType)}
                {selectedType === 'call' ? 'Schedule Call' : 
                 selectedType === 'letter' ? 'Generate Letter' :
                 'Send ' + selectedType.toUpperCase()}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                {getReminderIcon(selectedType)}
                {selectedType.toUpperCase()}
              </Badge>
              <Badge className={getReminderColor(form.watch('reminder_level'))}>
                Level {form.watch('reminder_level')}
              </Badge>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {form.watch('scheduled_date')}
              </Badge>
            </div>

            {(selectedType === 'email' || selectedType === 'letter') && form.watch('subject') && (
              <div>
                <Label className="text-sm font-medium">Subject:</Label>
                <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{form.watch('subject')}</p>
              </div>
            )}

            {form.watch('message') && (
              <div>
                <Label className="text-sm font-medium">Message:</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded text-sm whitespace-pre-line border-l-4 border-blue-500">
                  {form.watch('message')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};