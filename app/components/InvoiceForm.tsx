"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, Plus, Save, Calendar, Building2, PoundSterling } from "lucide-react";
import { useInvoiceStore } from "@/app/lib/invoiceStore";
import { budgetTemplate } from "@/app/utils/template";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export default function InvoiceForm() {
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const [formData, setFormData] = useState({
    vendor: "",
    invoiceNumber: "",
    date: "",
    dueDate: "",
    totalAmount: "",
    notes: "",
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const spendingCategories = budgetTemplate.flatMap(group => group.categories);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.vendor.trim()) newErrors.vendor = "Vendor is required";
    if (!formData.invoiceNumber.trim()) newErrors.invoiceNumber = "Invoice number is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = "Valid total amount is required";
    }
    if (items.length === 0) newErrors.items = "At least one item is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const invoice = {
      id: crypto.randomUUID(),
      vendor: formData.vendor,
      invoiceNumber: formData.invoiceNumber,
      date: formData.date,
      dueDate: formData.dueDate || formData.date,
      totalAmount: parseFloat(formData.totalAmount),
      notes: formData.notes,
      items: items,
      createdAt: new Date().toISOString(),
    };

    addInvoice(invoice);
    
    // Reset form
    setFormData({
      vendor: "",
      invoiceNumber: "",
      date: "",
      dueDate: "",
      totalAmount: "",
      notes: "",
    });
    setItems([]);
    setErrors({});
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description: "",
      amount: 0,
      category: spendingCategories[0] || "Other",
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalItemsAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Invoice Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor/Company</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="e.g., Tesco, Amazon, etc."
              className={cn(errors.vendor && "border-destructive")}
            />
            {errors.vendor && <p className="text-sm text-destructive">{errors.vendor}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              placeholder="e.g., INV-2024-001"
              className={cn(errors.invoiceNumber && "border-destructive")}
            />
            {errors.invoiceNumber && <p className="text-sm text-destructive">{errors.invoiceNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Invoice Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={cn(errors.date && "border-destructive")}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Amount and Notes */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Amount (£)</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              placeholder="0.00"
              className={cn(errors.totalAmount && "border-destructive")}
            />
            {errors.totalAmount && <p className="text-sm text-destructive">{errors.totalAmount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this invoice..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Invoice Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Invoice Items</h3>
          <Button type="button" onClick={addItem} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No items added yet. Click "Add Item" to start.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Item description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateItem(item.id, "category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {spendingCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount (£)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {items.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-semibold">Items Total:</span>
                <span className="font-bold text-lg">£{totalItemsAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}
      </div>

      <Separator />

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => {
          setFormData({
            vendor: "",
            invoiceNumber: "",
            date: "",
            dueDate: "",
            totalAmount: "",
            notes: "",
          });
          setItems([]);
          setErrors({});
        }}>
          Reset
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          Save Invoice
        </Button>
      </div>
    </motion.form>
  );
} 