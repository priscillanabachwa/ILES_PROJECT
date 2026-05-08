import secrets


def generate_reset_code():
    """Generate a secure 6-digit password reset code."""
    return ''.join(secrets.choice('0123456789') for _ in range(6))
