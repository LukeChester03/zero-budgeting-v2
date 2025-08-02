"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Save, CheckCircle, AlertCircle } from "lucide-react";
import { useFirebaseStore } from "@/lib/store-firebase";
import { useAuth } from "@/lib/auth-context";
import { userService } from "@/lib/user-service";

export default function MonthlyIncomeInput() {
  const [income, setIncome] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isNotEarning, setIsNotEarning] = useState(false);
  
  const { user } = useAuth();
  const { income: storeIncome, isEarning: storeIsEarning, saveIncome } = useFirebaseStore();

  useEffect(() => {
    if (storeIncome > 0) {
      setIncome(storeIncome.toString());
    }
  }, [storeIncome]);

  // Update local state when store income changes
  useEffect(() => {
    if (storeIncome > 0) {
      setIncome(storeIncome.toString());
      // Hide modal if income is loaded from store
      if (showModal) {
        console.log('Income loaded from store, hiding modal');
        setShowModal(false);
      }
    } else {
      setIncome("");
    }
  }, [storeIncome, showModal]);

  // Show modal for new users or users with £0 income
  useEffect(() => {
    if (user && !showModal) {
      const checkIncomeStatus = async () => {
        try {
          const userProfile = await userService.getUserProfile(user.uid);
          
          // Check if user profile exists and has income set
          if (userProfile && userProfile.monthlyIncome !== undefined && userProfile.monthlyIncome > 0) {
            console.log('Income already exists for user, not showing modal');
            // Income exists, don't show modal
            return;
          }
          
          // Show modal if:
          // 1. No user profile exists (new user)
          // 2. User profile exists but monthlyIncome is 0, undefined, or null
          // 3. User is earning (isEarning is true or undefined)
          if (!userProfile || 
              (userProfile.monthlyIncome === undefined || userProfile.monthlyIncome === 0 || userProfile.monthlyIncome === null) &&
              (userProfile?.isEarning !== false)) {
            console.log('Showing income modal - user needs to set income');
            setShowModal(true);
          } else {
            console.log('Income already set or user not earning, not showing modal');
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
          // If we can't check, don't show modal
        }
      };
      
      checkIncomeStatus();
    }
  }, [user, showModal]);

  const handleSave = async () => {
    if (!user) {
      setError("You must be logged in to save your income");
      return;
    }

    const incomeValue = isNotEarning ? 0 : parseFloat(income);
    if (!isNotEarning && (isNaN(incomeValue) || incomeValue <= 0)) {
      setError("Please enter a valid income amount");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      console.log('Attempting to save income:', { incomeValue, isNotEarning, userId: user.uid });
      
      // Use the store's saveIncome function
      await saveIncome(incomeValue, !isNotEarning);
      
      console.log('Income saved successfully');
      
      // Close modal and reset form
      setIsEditing(false);
      setShowModal(false);
      setIncome("");
      setIsNotEarning(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving income:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          setError("Permission denied. Please try logging out and back in.");
        } else if (error.message.includes('not authenticated')) {
          setError("You must be logged in to save your income.");
        } else {
          setError(`Failed to save income: ${error.message}`);
        }
      } else {
        setError("Failed to save income. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setIsNotEarning(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIncome(storeIncome > 0 ? storeIncome.toString() : "");
    setError("");
    setIsNotEarning(false);
  };

  const handleNotEarning = () => {
    setIsNotEarning(true);
    setIncome("");
    setError("");
  };

  const handleEarning = () => {
    setIsNotEarning(false);
    setIncome("");
    setError("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Success Alert */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>Income saved successfully!</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Income Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card className="shadow-lg border-2 border-primary/10 hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              Monthly Income
            </CardTitle>
            <CardDescription className="text-base">
              Your monthly income after tax is used to calculate budget allocations and track your financial progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isEditing && (storeIncome > 0 || !storeIsEarning) ? (
              <div className="space-y-4">
                {storeIsEarning ? (
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <Label className="text-lg font-medium">Current Monthly Income:</Label>
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(storeIncome)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <Label className="text-lg font-medium">Income Status:</Label>
                    <span className="text-lg font-medium text-muted-foreground">
                      Not currently earning
                    </span>
                  </div>
                )}
                <Button onClick={handleEdit} variant="outline" className="w-full h-12 text-lg">
                  Edit Income
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Income Type Selection */}
                <div className="space-y-3">
                  <Label className="text-lg font-medium">Are you currently earning income?</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={!isNotEarning ? "default" : "outline"}
                      onClick={handleEarning}
                      className="flex-1 h-12"
                    >
                      Yes, I am earning
                    </Button>
                    <Button
                      variant={isNotEarning ? "default" : "outline"}
                      onClick={handleNotEarning}
                      className="flex-1 h-12"
                    >
                      I am not currently earning
                    </Button>
                  </div>
                </div>

                {/* Income Input (only show if earning) */}
                {!isNotEarning && (
                  <div className="space-y-3">
                    <Label htmlFor="income" className="text-lg font-medium">
                      Monthly Income After Tax
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-muted-foreground text-lg">£</span>
                      <Input
                        id="income"
                        type="number"
                        placeholder="0.00"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        className="pl-12 h-12 text-lg"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSave} 
                    className="flex-1 h-12 text-lg"
                    disabled={isSaving || (!isNotEarning && !income.trim())}
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save Income
                      </>
                    )}
                  </Button>
                  {storeIncome > 0 && (
                    <Button onClick={handleCancel} variant="outline" className="h-12 text-lg">
                      Cancel
                    </Button>
                  )}
                </div>

                {/* Help Text */}
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 Your income helps us calculate your budget allocations and track your financial progress. 
                    {isNotEarning ? " You can update this later when your situation changes." : " This information is kept private and secure."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal for New Users */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-primary" />
              Welcome! Let's Get Started
            </DialogTitle>
            <DialogDescription className="text-base">
              To help you create effective budgets, we need to know your monthly income after tax.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Income Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Are you currently earning income?</Label>
              <div className="flex gap-3">
                <Button
                  variant={!isNotEarning ? "default" : "outline"}
                  onClick={handleEarning}
                  className="flex-1"
                >
                  Yes, I am earning
                </Button>
                <Button
                  variant={isNotEarning ? "default" : "outline"}
                  onClick={handleNotEarning}
                  className="flex-1"
                >
                  I am not currently earning
                </Button>
              </div>
            </div>

            {/* Income Input (only show if earning) */}
            {!isNotEarning && (
              <div className="space-y-3">
                <Label htmlFor="modal-income" className="text-base font-medium">
                  Monthly Income After Tax
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">£</span>
                  <Input
                    id="modal-income"
                    type="number"
                    placeholder="0.00"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="pl-8"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleSave} 
                className="flex-1"
                disabled={isSaving || (!isNotEarning && !income.trim())}
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Continue
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <p className="text-xs text-blue-800">
                💡 You can always update your income later in your profile settings.
                {isNotEarning ? " We'll help you create budgets when you start earning." : " This helps us create personalized budget recommendations."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}