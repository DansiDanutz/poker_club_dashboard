"use client";

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Database, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface DataErrorBoundaryProps {
  children: ReactNode;
  dataType: string;
  isOnline: boolean;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface DataErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class DataErrorBoundary extends Component<DataErrorBoundaryProps, DataErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: DataErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<DataErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Data error in ${this.props.dataType}:`, error, errorInfo);
    
    this.setState({
      error,
      retryCount: this.state.retryCount + 1
    });
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({ 
        hasError: false, 
        error: undefined,
        retryCount: this.state.retryCount + 1
      });
      
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message.includes('network') || 
                           this.state.error?.message.includes('fetch') ||
                           !this.props.isOnline;

      return (
        <Alert variant={isNetworkError ? "default" : "destructive"} className="m-4">
          {isNetworkError ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          <AlertTitle>
            {isNetworkError ? 'Connection Issue' : 'Data Error'} - {this.props.dataType}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              {isNetworkError ? (
                <>
                  Unable to load {this.props.dataType.toLowerCase()} data. 
                  Please check your internet connection and try again.
                </>
              ) : (
                <>
                  There was an error loading {this.props.dataType.toLowerCase()} data. 
                  The application will continue to work with cached data.
                </>
              )}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3 p-3 bg-muted rounded border">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
                disabled={this.state.retryCount >= this.maxRetries}
              >
                <RefreshCw className="h-4 w-4" />
                {this.state.retryCount >= this.maxRetries ? 'Max Retries' : `Retry (${this.state.retryCount}/${this.maxRetries})`}
              </Button>
              
              {isNetworkError && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <Wifi className="h-4 w-4" />
                  Check Connection
                </Button>
              )}
            </div>
            
            {this.state.retryCount >= this.maxRetries && (
              <p className="mt-2 text-sm text-muted-foreground">
                Maximum retry attempts reached. The page will reload automatically.
              </p>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Convenience components for different data types
export const PlayersDataErrorBoundary = ({ 
  children, 
  isOnline, 
  onRetry 
}: { 
  children: ReactNode; 
  isOnline: boolean; 
  onRetry?: () => void; 
}) => (
  <DataErrorBoundary dataType="Players" isOnline={isOnline} onRetry={onRetry}>
    {children}
  </DataErrorBoundary>
);

export const SessionsDataErrorBoundary = ({ 
  children, 
  isOnline, 
  onRetry 
}: { 
  children: ReactNode; 
  isOnline: boolean; 
  onRetry?: () => void; 
}) => (
  <DataErrorBoundary dataType="Sessions" isOnline={isOnline} onRetry={onRetry}>
    {children}
  </DataErrorBoundary>
);

export const PromotionsDataErrorBoundary = ({ 
  children, 
  isOnline, 
  onRetry 
}: { 
  children: ReactNode; 
  isOnline: boolean; 
  onRetry?: () => void; 
}) => (
  <DataErrorBoundary dataType="Promotions" isOnline={isOnline} onRetry={onRetry}>
    {children}
  </DataErrorBoundary>
);
