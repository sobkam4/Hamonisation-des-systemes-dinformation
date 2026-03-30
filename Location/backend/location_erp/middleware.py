import logging
import json
import time
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.conf import settings
from django.http import JsonResponse
from ipware import get_client_ip
from user_agents import parse
from auditlog.models import LogEntry

logger = logging.getLogger('auditlog')
security_logger = logging.getLogger('django.security')

User = get_user_model()

class AuditMiddleware(MiddlewareMixin):
    """
    Middleware pour l'audit et la traçabilité des actions
    Enregistre toutes les requêtes API avec détails complets
    """
    
    def process_request(self, request):
        """Traite la requête entrante"""
        request.start_time = time.time()
        
        # Récupérer l'IP client
        client_ip, is_routable = get_client_ip(request)
        request.client_ip = client_ip or '0.0.0.0'
        
        # Parser le user agent
        user_agent_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = parse(user_agent_string)
        request.user_agent = user_agent
        
        # Logger les requêtes sensibles
        if request.path.startswith('/api/auth/') or request.method in ['POST', 'PUT', 'DELETE']:
            self._log_request(request)
        
        return None
    
    def process_response(self, request, response):
        """Traite la réponse sortante"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Logger les réponses avec erreurs
            if response.status_code >= 400:
                self._log_error_response(request, response, duration)
            
            # Logger les requêtes longues
            if duration > 2.0:  # Plus de 2 secondes
                self._log_slow_request(request, response, duration)
        
        return response
    
    def _log_request(self, request):
        """Enregistre les détails de la requête"""
        try:
            user = getattr(request, 'user', None)
            username = user.username if user and user.is_authenticated else 'anonymous'
            
            # Masquer les données sensibles
            body = self._sanitize_body(request.body)
            
            log_data = {
                'method': request.method,
                'path': request.path,
                'ip': request.client_ip,
                'user': username,
                'user_agent': str(request.user_agent),
                'body': body,
                'query_params': dict(request.GET),
                'timestamp': time.time(),
            }
            
            logger.info(f"API Request: {json.dumps(log_data)}")
            
            # Vérifier les activités suspectes
            self._check_suspicious_activity(request, log_data)
            
        except Exception as e:
            logger.error(f"Error logging request: {e}")
    
    def _log_error_response(self, request, response, duration):
        """Enregistre les réponses d'erreur"""
        try:
            user = getattr(request, 'user', None)
            username = user and user.is_authenticated and user.username or 'anonymous'
            
            error_data = {
                'method': request.method,
                'path': request.path,
                'ip': request.client_ip,
                'user': username,
                'status_code': response.status_code,
                'duration': duration,
                'user_agent': str(request.user_agent),
            }
            
            security_logger.warning(f"Error Response: {json.dumps(error_data)}")
            
        except Exception as e:
            logger.error(f"Error logging error response: {e}")
    
    def _log_slow_request(self, request, response, duration):
        """Enregistre les requêtes lentes"""
        try:
            slow_data = {
                'method': request.method,
                'path': request.path,
                'duration': duration,
                'status_code': response.status_code,
            }
            
            logger.warning(f"Slow Request: {json.dumps(slow_data)}")
            
        except Exception as e:
            logger.error(f"Error logging slow request: {e}")
    
    def _sanitize_body(self, body):
        """Masque les données sensibles dans le corps de la requête"""
        try:
            if not body:
                return {}
            
            body_str = body.decode('utf-8')
            data = json.loads(body_str)
            
            # Champs sensibles à masquer
            sensitive_fields = ['password', 'token', 'secret', 'key', 'credit_card']
            
            def mask_sensitive(obj):
                if isinstance(obj, dict):
                    return {
                        k: '***MASKED***' if any(field in k.lower() for field in sensitive_fields) 
                        else mask_sensitive(v)
                        for k, v in obj.items()
                    }
                elif isinstance(obj, list):
                    return [mask_sensitive(item) for item in obj]
                return obj
            
            return mask_sensitive(data)
            
        except (json.JSONDecodeError, UnicodeDecodeError):
            return {'raw': '***MASKED***'}
    
    def _check_suspicious_activity(self, request, log_data):
        """Détecte les activités suspectes"""
        # Trop de requêtes depuis la même IP
        recent_requests = self._count_recent_requests(request.client_ip)
        if recent_requests > 100:  # Plus de 100 requêtes récentes
            security_logger.warning(f"High frequency requests from IP: {request.client_ip}")
        
        # Requêtes depuis des IPs suspectes
        if self._is_suspicious_ip(request.client_ip):
            security_logger.warning(f"Suspicious IP: {request.client_ip}")
        
        # User agents suspects
        if self._is_suspicious_user_agent(request.user_agent):
            security_logger.warning(f"Suspicious user agent: {request.user_agent}")
    
    def _count_recent_requests(self, ip):
        """Compte les requêtes récentes depuis une IP"""
        # Implémentation simple - en production, utiliser Redis ou cache
        return 0
    
    def _is_suspicious_ip(self, ip):
        """Vérifie si une IP est suspecte"""
        # Implémentation simple - en production, utiliser une liste noire
        return False
    
    def _is_suspicious_user_agent(self, user_agent):
        """Vérifie si le user agent est suspect"""
        suspicious_patterns = ['bot', 'crawler', 'scanner', 'hack']
        user_agent_str = str(user_agent).lower()
        return any(pattern in user_agent_str for pattern in suspicious_patterns)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware pour ajouter des headers de sécurité
    """
    
    def process_response(self, request, response):
        """Ajoute les headers de sécurité"""
        # Headers de sécurité
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Pour les API
        if request.path.startswith('/api/'):
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range'
        
        return response


class RequestIDMiddleware(MiddlewareMixin):
    """
    Middleware pour ajouter un ID unique à chaque requête
    """
    
    def process_request(self, request):
        """Ajoute un ID unique à la requête"""
        import uuid
        request.request_id = str(uuid.uuid4())
        request.META['HTTP_X_REQUEST_ID'] = request.request_id
    
    def process_response(self, request, response):
        """Ajoute l'ID de requête à la réponse"""
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id
        return response


class DatabaseQueryLogger(MiddlewareMixin):
    """
    Middleware pour logger les requêtes de base de données
    """
    
    def process_request(self, request):
        """Démarre le monitoring des requêtes DB"""
        from django.db import connection
        connection.queries_log.clear()
    
    def process_response(self, request, response):
        """Log les requêtes de base de données"""
        from django.db import connection
        
        if hasattr(connection, 'queries') and connection.queries:
            query_count = len(connection.queries)
            total_time = sum(float(q['time']) for q in connection.queries)
            
            if query_count > 50 or total_time > 1.0:  # Alertes de performance
                logger.warning(f"DB Performance - Queries: {query_count}, Time: {total_time:.3f}s")
        
        return response
