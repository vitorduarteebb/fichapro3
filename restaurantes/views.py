def get_perfil_usuario_restaurante(user, restaurante_id):
    if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
        return None
    try:
        vinculo = UsuarioRestaurantePerfil.objects.get(usuario=user, restaurante_id=restaurante_id)
        return vinculo.perfil
    except UsuarioRestaurantePerfil.DoesNotExist:
        return None 