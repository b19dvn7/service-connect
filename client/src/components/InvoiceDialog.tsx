import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Save } from "lucide-react";
import type { MaintenanceRequest, Invoice } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";

interface InvoiceDialogProps {
  request: MaintenanceRequest;
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "secondary" | "destructive";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

const SERVICE_PREFIX = "SERVICE_JSON:";

function getRequestNotes(request: MaintenanceRequest): string {
  const description = request.description ?? "";
  if (!description.startsWith(SERVICE_PREFIX)) return "";
  try {
    const payload = JSON.parse(description.slice(SERVICE_PREFIX.length));
    const notes: string[] = [];

    if (typeof payload.internalNotes === "string" && payload.internalNotes.trim()) {
      notes.push(payload.internalNotes.trim());
    }

    if (payload.groups && typeof payload.groups === "object") {
      Object.entries(payload.groups).forEach(([label, group]) => {
        const note = (group as { notes?: string })?.notes?.trim();
        if (note) notes.push(`${label}: ${note}`);
      });
    }

    if (!notes.length) {
      const fallback = payload.additionalNotes || payload.issueText;
      if (typeof fallback === "string" && fallback.trim()) {
        notes.push(fallback.trim());
      }
    }

    return notes.join("\n");
  } catch {
    return "";
  }
}

export function InvoiceDialog({
  request,
  triggerLabel,
  triggerClassName,
  triggerVariant,
  triggerSize,
  showIcon = true,
}: InvoiceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch existing invoice for this request
  const { data: invoice, isLoading } = useQuery<Invoice | null>({
    queryKey: ["invoice", request.id],
    queryFn: async () => {
      const url = buildUrl(api.invoices.getByRequest.path, { requestId: request.id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open,
  });

  // Form state
  const [formData, setFormData] = useState({
    laborDescription: "",
    laborHours: "",
    laborRate: "",
    laborTotal: "",
    partsDetails: "",
    partsTotal: "",
    miscDescription: "",
    miscTotal: "",
    subtotal: "",
    tax: "",
    total: "",
    notes: "",
    paymentStatus: "unpaid",
    paymentMethod: "",
  });

  // Update form when invoice loads
  useEffect(() => {
    if (invoice) {
      setFormData({
        laborDescription: invoice.laborDescription || "",
        laborHours: invoice.laborHours || "",
        laborRate: invoice.laborRate || "",
        laborTotal: invoice.laborTotal || "",
        partsDetails: invoice.partsDetails || "",
        partsTotal: invoice.partsTotal || "",
        miscDescription: invoice.miscDescription || "",
        miscTotal: invoice.miscTotal || "",
        subtotal: invoice.subtotal || "",
        tax: invoice.tax || "",
        total: invoice.total || "",
        notes: invoice.notes || "",
        paymentStatus: invoice.paymentStatus || "unpaid",
        paymentMethod: invoice.paymentMethod || "",
      });
    } else {
      // Pre-fill from work order
      const defaultNotes = getRequestNotes(request);
      setFormData(prev => ({
        ...prev,
        laborDescription: request.workDone || "",
        partsDetails: request.partsUsed || "",
        notes: defaultNotes || prev.notes,
      }));
    }
  }, [invoice, request]);

  // Auto-calculate totals
  useEffect(() => {
    const labor = parseFloat(formData.laborTotal) || 0;
    const parts = parseFloat(formData.partsTotal) || 0;
    const misc = parseFloat(formData.miscTotal) || 0;
    const subtotal = labor + parts + misc;
    const taxAmount = parseFloat(formData.tax) || 0;
    const total = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
    }));
  }, [formData.laborTotal, formData.partsTotal, formData.miscTotal, formData.tax]);

  // Calculate labor total
  useEffect(() => {
    const hours = parseFloat(formData.laborHours) || 0;
    const rate = parseFloat(formData.laborRate) || 0;
    const laborTotal = hours * rate;
    setFormData(prev => ({ ...prev, laborTotal: laborTotal.toFixed(2) }));
  }, [formData.laborHours, formData.laborRate]);

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${request.id}`;
      
      const res = await fetch(api.invoices.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requestId: request.id,
          invoiceNumber,
          ...formData,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", request.id] });
      toast({ title: "Invoice Created", description: "Invoice saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create invoice", variant: "destructive" });
    },
  });

  // Update invoice mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      
      const url = buildUrl(api.invoices.update.path, { id: invoice.id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to update invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", request.id] });
      toast({ title: "Invoice Updated", description: "Changes saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update invoice", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (invoice) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const generatePDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ 
        title: "Popup Blocked", 
        description: "Please allow popups for this site to download PDF",
        variant: "destructive" 
      });
      return;
    }

    const invoiceData = invoice || { invoiceNumber: `INV-DRAFT-${request.id}` };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
            gap: 15px;
          }
          .company {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #000;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
          }
          th {
            background: #f5f5f5;
            padding: 10px 8px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            word-wrap: break-word;
          }
          .text-right { text-align: right; }
          .totals-table {
            width: 100%;
            max-width: 300px;
            margin-left: auto;
            margin-top: 20px;
          }
          .totals-table td {
            border: none;
            padding: 5px 10px;
            font-size: 14px;
          }
          .total-row {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #000;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #000;
            word-wrap: break-word;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #666;
          }
          .print-btn {
            padding: 14px 32px;
            background: #000;
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            margin: 30px auto 20px;
            display: block;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: background 0.2s;
          }
          .print-btn:hover {
            background: #333;
          }
          .print-btn:active {
            background: #000;
            transform: scale(0.98);
          }
          
          @media (max-width: 600px) {
            body { 
              padding: 15px; 
              font-size: 13px; 
            }
            .header { 
              flex-direction: column; 
            }
            .company { 
              font-size: 18px; 
            }
            .invoice-title { 
              font-size: 24px; 
            }
            .info-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            table { 
              font-size: 11px; 
            }
            th, td { 
              padding: 8px 5px; 
            }
            .totals-table td { 
              font-size: 13px; 
            }
            .total-row { 
              font-size: 16px; 
            }
            .print-btn {
              width: 100%;
              padding: 16px;
            }
          }
          
          @media print {
            body { 
              padding: 0; 
            }
            .print-btn { 
              display: none; 
            }
            @page { 
              margin: 1.5cm; 
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company">HeavyDuty Ops</div>
            <div style="margin-top: 5px; font-size: 12px;">Fleet Maintenance Services</div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title">INVOICE</div>
            <div style="font-size: 14px; margin-top: 5px; font-weight: 600;">${invoiceData.invoiceNumber}</div>
            <div style="font-size: 12px; color: #666; margin-top: 3px;">
              ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="section">
            <div class="section-title">Bill To</div>
            <div style="font-size: 14px; font-weight: bold;">${request.customerName}</div>
            <div style="font-size: 12px; color: #666; margin-top: 3px;">${request.contactInfo}</div>
          </div>
          <div class="section">
            <div class="section-title">Vehicle Details</div>
            <div style="font-size: 12px; font-weight: 600;">${request.vehicleInfo}</div>
            ${request.vehicleColor ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">Color: ${request.vehicleColor}</div>` : ""}
            <div style="font-size: 12px; margin-top: 5px; color: #666;">Work Order #${request.id}</div>
          </div>
        </div>

        ${formData.laborDescription ? `
        <div class="section">
          <div class="section-title">Labor</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="width: 80px;">Hours</th>
                <th style="width: 80px;">Rate</th>
                <th style="width: 100px;" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${formData.laborDescription.replace(/\n/g, '<br>')}</td>
                <td>${formData.laborHours || "-"}</td>
                <td>$${formData.laborRate || "0.00"}</td>
                <td class="text-right">$${formData.laborTotal || "0.00"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ""}

        ${formData.partsDetails ? `
        <div class="section">
          <div class="section-title">Parts & Materials</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="width: 120px;" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${formData.partsDetails.replace(/\n/g, '<br>')}</td>
                <td class="text-right">$${formData.partsTotal || "0.00"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ""}

        ${formData.miscDescription ? `
        <div class="section">
          <div class="section-title">Additional Charges</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="width: 120px;" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${formData.miscDescription}</td>
                <td class="text-right">$${formData.miscTotal || "0.00"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ""}

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">$${formData.subtotal}</td>
          </tr>
          <tr>
            <td>Tax:</td>
            <td class="text-right">$${formData.tax || "0.00"}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL:</td>
            <td class="text-right">$${formData.total}</td>
          </tr>
        </table>

        ${formData.notes ? `
        <div class="notes">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 11px; text-transform: uppercase;">Notes</div>
          <div style="font-size: 12px; line-height: 1.6;">${formData.notes.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ""}

        <div class="footer">
          <div style="margin-bottom: 5px;"><strong>Payment Status:</strong> ${formData.paymentStatus.toUpperCase()}</div>
          ${formData.paymentMethod ? `<div><strong>Payment Method:</strong> ${formData.paymentMethod}</div>` : ""}
        </div>

        <button onclick="window.print()" class="print-btn">📄 Download PDF</button>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant ?? "default"}
          size={triggerSize ?? "sm"}
          className={
            triggerClassName ??
            "bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          }
        >
          {showIcon ? <FileText className="w-4 h-4 mr-2" /> : null}
          {triggerLabel ?? (invoice ? "View Invoice" : "Create Invoice")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="uppercase font-display flex items-center gap-2 text-base sm:text-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            {invoice ? `Invoice ${invoice.invoiceNumber}` : "New Invoice"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading invoice...</div>
        ) : (
          <div className="space-y-4 sm:space-y-6 pt-4">
            {/* Work Order Reference */}
            <div className="bg-secondary/30 p-3 sm:p-4 rounded-lg border border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
                Work Order #{request.id}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span> {request.customerName}
                </div>
                <div>
                  <span className="text-muted-foreground">Vehicle:</span> {request.vehicleInfo}
                </div>
              </div>
            </div>

            {/* Labor Section */}
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">Labor</h3>
              <div className="grid gap-3">
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={formData.laborDescription}
                    onChange={(e) => setFormData({ ...formData, laborDescription: e.target.value })}
                    placeholder="Work performed..."
                    className="bg-secondary/30 text-sm min-h-[80px] sm:min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <Label className="text-xs">Hours</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={formData.laborHours}
                      onChange={(e) => setFormData({ ...formData, laborHours: e.target.value })}
                      placeholder="0.00"
                      className="bg-secondary/30 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rate ($/hr)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.laborRate}
                      onChange={(e) => setFormData({ ...formData, laborRate: e.target.value })}
                      placeholder="0.00"
                      className="bg-secondary/30 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={`$${formData.laborTotal}`}
                      readOnly
                      className="bg-secondary/50 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parts Section */}
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">Parts & Materials</h3>
              <div className="grid gap-3">
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={formData.partsDetails}
                    onChange={(e) => setFormData({ ...formData, partsDetails: e.target.value })}
                    placeholder="Parts used..."
                    className="bg-secondary/30 text-sm min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs">Total Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.partsTotal}
                    onChange={(e) => setFormData({ ...formData, partsTotal: e.target.value })}
                    placeholder="0.00"
                    className="bg-secondary/30 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Misc Charges */}
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">Additional Charges</h3>
              <div className="grid gap-3">
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={formData.miscDescription}
                    onChange={(e) => setFormData({ ...formData, miscDescription: e.target.value })}
                    placeholder="Fees, shop supplies, etc..."
                    className="bg-secondary/30 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.miscTotal}
                    onChange={(e) => setFormData({ ...formData, miscTotal: e.target.value })}
                    placeholder="0.00"
                    className="bg-secondary/30 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-bold">${formData.subtotal}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <Label className="text-xs">Tax:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                    placeholder="0.00"
                    className="w-24 sm:w-32 bg-secondary/30 text-right text-sm"
                  />
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold border-t border-white/20 pt-2">
                  <span>TOTAL:</span>
                  <span>${formData.total}</span>
                </div>
              </div>
            </div>

            {/* Payment & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs">Payment Status</Label>
                <Select value={formData.paymentStatus} onValueChange={(v) => setFormData({ ...formData, paymentStatus: v })}>
                  <SelectTrigger className="bg-secondary/30 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Input
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  placeholder="Cash, Check, Card..."
                  className="bg-secondary/30 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or terms..."
                className="bg-secondary/30 text-sm min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {invoice ? "Update Invoice" : "Create Invoice"}
              </Button>
              <Button
                onClick={generatePDF}
                variant="outline"
                className="flex-1 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
