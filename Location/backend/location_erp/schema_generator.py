"""
Contournement drf-spectacular : create_view lit getattr(action, 'kwargs') sur une
méthode liée (ex. view.post), alors que @extend_schema attache le schéma sur la
fonction sous-jacente (__func__). Sans cela, @extend_schema + @api_view est ignoré.
"""
from drf_spectacular.drainage import error
from drf_spectacular.extensions import OpenApiViewExtension
from drf_spectacular.generators import SchemaGenerator as SpectacularSchemaGenerator
from drf_spectacular.plumbing import get_class
from rest_framework import views, viewsets
from rest_framework.settings import api_settings


class SchemaGenerator(SpectacularSchemaGenerator):
    def create_view(self, callback, method, request=None):
        override_view = OpenApiViewExtension.get_match(callback)
        if override_view:
            original_cls = callback.cls
            callback.cls = override_view.view_replacement()

        view = super(SpectacularSchemaGenerator, self).create_view(callback, method, None)

        view.swagger_fake_view = True

        if override_view:
            callback.cls = original_cls

        if isinstance(view, viewsets.ViewSetMixin):
            action = getattr(view, view.action)
        elif isinstance(view, views.APIView):
            action = getattr(view, method.lower())
        else:
            error(
                'Using not supported View class. Class must be derived from APIView '
                'or any of its subclasses like GenericApiView, GenericViewSet.'
            )
            return view

        func = getattr(action, '__func__', action)
        action_schema = getattr(func, 'kwargs', {}).get('schema', None)
        if not action_schema:
            return view

        action_schema_class = get_class(action_schema)
        view_schema_class = get_class(callback.cls.schema)

        if not issubclass(action_schema_class, view_schema_class):
            mro = tuple(
                cls for cls in action_schema_class.__mro__
                if cls not in api_settings.DEFAULT_SCHEMA_CLASS.__mro__
            ) + view_schema_class.__mro__
            action_schema_class = type('ExtendedRearrangedSchema', mro, {})

        self._set_schema_to_view(view, action_schema_class())
        return view
