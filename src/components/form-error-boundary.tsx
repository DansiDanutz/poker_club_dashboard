"use client";

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { FileText, RefreshCw, Save } from 'lucide-react';

interface FormErrorBoundaryProps {
  children: ReactNode;
  formName: string;
  onRetry?: () => void;
  onSaveDraft?: () => void;
  fallback?: ReactNode;
}

interface FormErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  formData?: any;
}

export class FormErrorBoundary extends Component<FormErrorBoundaryProps, FormErrorBoundaryState> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): FormErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Form error in ${this.props.formName}:`, error, errorInfo);
    
    this.setState({
      error
    });

    // Try to save form data to localStorage as draft
    try {
      const formData = this.extractFormData();
      if (formData) {
        localStorage.setItem(`${this.props.formName}_draft`, JSON.stringify(formData));
        this.setState({ formData });
      }
    } catch (e) {
      console.warn('Could not save form draft:', e);
    }
  }

  extractFormData = () => {
    // This is a simplified version - in a real app you'd want to extract
    // form data more intelligently based on the form structure
    return null;
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, formData: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleSaveDraft = () => {
    if (this.props.onSaveDraft) {
      this.props.onSaveDraft();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive" className="m-4">
          <FileText className="h-4 w-4" />
          <AlertTitle>Form Error - {this.props.formName}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              There was an error with the {this.props.formName.toLowerCase()} form. 
              Your data may have been saved as a draft.
            </p>
            
            {this.state.formData && (
              <div className="mb-3 p-3 bg-muted rounded border">
                <p className="text-sm font-medium mb-1">Draft Data Available</p>
                <p className="text-xs text-muted-foreground">
                  Your form data has been saved locally and can be restored.
                </p>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3 p-3 bg-destructive/10 rounded border">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\nStack Trace:\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
            
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Form
              </Button>
              
              {this.state.formData && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleSaveDraft}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Convenience components for common forms
export const AddPlayerFormErrorBoundary = ({ children, onRetry }: { children: ReactNode; onRetry?: () => void; }) => (
  <FormErrorBoundary formName="Add Player" onRetry={onRetry}>
    {children}
  </FormErrorBoundary>
);

export const AddPromotionFormErrorBoundary = ({ children, onRetry }: { children: ReactNode; onRetry?: () => void; }) => (
  <FormErrorBoundary formName="Add Promotion" onRetry={onRetry}>
    {children}
  </FormErrorBoundary>
);

export const PenaltyFormErrorBoundary = ({ children, onRetry }: { children: ReactNode; onRetry?: () => void; }) => (
  <FormErrorBoundary formName="Penalty" onRetry={onRetry}>
    {children}
  </FormErrorBoundary>
);

export const AddonFormErrorBoundary = ({ children, onRetry }: { children: ReactNode; onRetry?: () => void; }) => (
  <FormErrorBoundary formName="Addon" onRetry={onRetry}>
    {children}
  </FormErrorBoundary>
);
