import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional
import json

class ServiceMonitor:
    """Monitor service health and performance"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0
        self.logger = logging.getLogger(f"monitor.{service_name}")
    
    def get_uptime(self) -> float:
        """Get service uptime in seconds"""
        return time.time() - self.start_time
    
    def record_request(self, duration: float, success: bool = True):
        """Record API request metrics"""
        self.request_count += 1
        self.total_response_time += duration
        if not success:
            self.error_count += 1
        
        avg_response_time = self.total_response_time / self.request_count
        error_rate = (self.error_count / self.request_count * 100) if self.request_count > 0 else 0
        
        self.logger.info(
            f"Request recorded | Total: {self.request_count} | "
            f"Errors: {self.error_count} | Error Rate: {error_rate:.2f}% | "
            f"Avg Response: {avg_response_time:.3f}s"
        )
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current service metrics"""
        uptime_seconds = self.get_uptime()
        uptime_hours = uptime_seconds / 3600
        
        avg_response_time = (
            self.total_response_time / self.request_count 
            if self.request_count > 0 
            else 0
        )
        error_rate = (
            self.error_count / self.request_count * 100 
            if self.request_count > 0 
            else 0
        )
        requests_per_hour = (
            self.request_count / uptime_hours 
            if uptime_hours > 0 
            else 0
        )
        
        return {
            'service_name': self.service_name,
            'uptime_seconds': uptime_seconds,
            'uptime_hours': round(uptime_hours, 2),
            'total_requests': self.request_count,
            'total_errors': self.error_count,
            'error_rate_percent': round(error_rate, 2),
            'avg_response_time_ms': round(avg_response_time * 1000, 2),
            'requests_per_hour': round(requests_per_hour, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'healthy' if error_rate < 5 else 'degraded' if error_rate < 10 else 'unhealthy'
        }
    
    def log_metrics(self):
        """Log current metrics"""
        metrics = self.get_metrics()
        self.logger.info(f"Metrics: {json.dumps(metrics, indent=2)}")
        return metrics


class StructuredLogger:
    """Create structured logs for better monitoring"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def log_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Log API request"""
        self.logger.info(
            f"API Request | Method: {method} | Endpoint: {endpoint} | "
            f"Status: {status_code} | Duration: {duration:.3f}s"
        )
    
    def log_database_operation(self, operation: str, table: str, duration: float, success: bool):
        """Log database operation"""
        status = "success" if success else "failed"
        self.logger.info(
            f"DB Operation | Operation: {operation} | Table: {table} | "
            f"Duration: {duration:.3f}s | Status: {status}"
        )
    
    def log_error(self, error_type: str, message: str, context: Optional[Dict[str, Any]] = None):
        """Log error with context"""
        context_str = json.dumps(context) if context else ""
        self.logger.error(
            f"Error | Type: {error_type} | Message: {message} | "
            f"Context: {context_str}"
        )
    
    def log_performance_warning(self, operation: str, duration: float, threshold: float):
        """Log performance warnings"""
        self.logger.warning(
            f"Performance Warning | Operation: {operation} | "
            f"Duration: {duration:.3f}s | Threshold: {threshold:.3f}s"
        )
