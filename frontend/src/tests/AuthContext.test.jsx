import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Composant de test pour lire le contexte
function DisplayAuth() {
  const { user, isAdmin } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.prenom : 'null'}</span>
      <span data-testid="role">{user?.role || 'none'}</span>
      <span data-testid="isAdmin">{isAdmin ? 'oui' : 'non'}</span>
    </div>
  );
}

function LoginButton() {
  const { login, logout } = useAuth();
  return (
    <>
      <button onClick={() => login({ prenom: 'Nabila', role: 'admin' }, 'token123')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('AuthContext', () => {

  test('✅ État initial : utilisateur non connecté', () => {
    render(<AuthProvider><DisplayAuth /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('isAdmin').textContent).toBe('non');
  });

  test('✅ Connexion : utilisateur visible dans le contexte', async () => {
    render(
      <AuthProvider>
        <DisplayAuth />
        <LoginButton />
      </AuthProvider>
    );
    await act(async () => screen.getByText('Login').click());
    expect(screen.getByTestId('user').textContent).toBe('Nabila');
    expect(screen.getByTestId('isAdmin').textContent).toBe('oui');
  });

  test('✅ Login sauvegarde token dans localStorage', async () => {
    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    await act(async () => screen.getByText('Login').click());
    expect(localStorage.getItem('token')).toBe('token123');
    expect(JSON.parse(localStorage.getItem('user')).prenom).toBe('Nabila');
  });

  test('✅ Déconnexion vide le contexte et localStorage', async () => {
    render(
      <AuthProvider>
        <DisplayAuth />
        <LoginButton />
      </AuthProvider>
    );
    await act(async () => screen.getByText('Login').click());
    await act(async () => screen.getByText('Logout').click());
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('✅ Restauration de session depuis localStorage', async () => {
    localStorage.setItem('token', 'tok_existant');
    localStorage.setItem('user', JSON.stringify({ prenom: 'Salma', role: 'user' }));

    render(<AuthProvider><DisplayAuth /></AuthProvider>);
    await act(async () => {});

    expect(screen.getByTestId('user').textContent).toBe('Salma');
    expect(screen.getByTestId('role').textContent).toBe('user');
  });

  test('✅ isAdmin = false pour rôle user', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify({ prenom: 'Salma', role: 'user' }));

    render(<AuthProvider><DisplayAuth /></AuthProvider>);
    await act(async () => {});
    expect(screen.getByTestId('isAdmin').textContent).toBe('non');
  });

  test('✅ localStorage corrompu ignoré silencieusement', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', 'json_invalide{{{');

    render(<AuthProvider><DisplayAuth /></AuthProvider>);
    await act(async () => {});
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});
