import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';

interface WelcomePageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.primary};
  font-size: 2.5rem;
  margin-bottom: ${theme.spacing.xl};
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
`;

const Button = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  border: none;
  border-radius: ${theme.borderRadius.medium};
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  font-family: ${theme.fonts.primary};
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${theme.colors.secondary};
  }
`;

const WelcomePage: React.FC<WelcomePageProps> = ({
  onLoginClick,
  onRegisterClick
}) => {
  return (
    <Container>
      <Title>Gerçek Zamanlı Çeviri Sistemi</Title>
      <ButtonContainer>
        <Button onClick={onLoginClick}>Giriş Yap</Button>
        <Button onClick={onRegisterClick}>Kayıt Ol</Button>
      </ButtonContainer>
    </Container>
  );
};

export default WelcomePage; 