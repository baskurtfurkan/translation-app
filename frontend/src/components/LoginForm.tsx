import React, { useState } from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onClose: () => void;
}

const FormContainer = styled.div`
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.large};
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.primary};
  margin-bottom: ${theme.spacing.lg};
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const Input = styled.input`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.textLight};
  border-radius: ${theme.borderRadius.small};
  font-family: ${theme.fonts.primary};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Button = styled.button`
  padding: ${theme.spacing.md};
  border: none;
  border-radius: ${theme.borderRadius.small};
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  font-family: ${theme.fonts.primary};
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${theme.colors.secondary};
  }

  &:disabled {
    background-color: ${theme.colors.textLight};
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${theme.spacing.md};
  right: ${theme.spacing.md};
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${theme.colors.textLight};
  cursor: pointer;
  padding: ${theme.spacing.xs};
  
  &:hover {
    color: ${theme.colors.text};
  }
`;

const ErrorMessage = styled.div`
  color: ${theme.colors.error};
  font-size: 0.9rem;
  text-align: center;
`;

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onLogin(username, password);
    } catch (err) {
      setError("Giriş başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <Title>Giriş Yap</Title>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
        <Input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </Form>
    </FormContainer>
  );
};

export default LoginForm;
