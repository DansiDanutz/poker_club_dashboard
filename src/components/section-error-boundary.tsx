"use client";

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.sectionName} section:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Here you would typically send to an error reporting service
      console.error('Production error logged:', {
        section: this.props.sectionName,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error in {this.props.sectionName}</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              Something went wrong in the {this.props.sectionName.toLowerCase()} section. 
              This section has been isolated to prevent the entire application from crashing.
            </p>
            
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
                Retry Section
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Convenience components for common sections
export const PlayerTableErrorBoundary = ({ children }: { children: ReactNode }) => (
  <SectionErrorBoundary sectionName="Player Table">
    {children}
  </SectionErrorBoundary>
);

export const ActiveTablesErrorBoundary = ({ children }: { children: ReactNode }) => (
  <SectionErrorBoundary sectionName="Active Tables">
    {children}
  </SectionErrorBoundary>
);

export const PromotionsErrorBoundary = ({ children }: { children: ReactNode }) => (
  <SectionErrorBoundary sectionName="Promotions">
    {children}
  </SectionErrorBoundary>
);

export const HistoryErrorBoundary = ({ children }: { children: ReactNode }) => (
  <SectionErrorBoundary sectionName="Session History">
    {children}
  </SectionErrorBoundary>
);

export const SettingsErrorBoundary = ({ children }: { children: ReactNode }) => (
  <SectionErrorBoundary sectionName="Settings">
    {children}
  </SectionErrorBoundary>
);

export const TVDisplayErrorBoundary = ({ children }: { children: ReactNode }) => (
  <SectionErrorBoundary sectionName="TV Display">
    {children}
  </SectionErrorBoundary>
);
