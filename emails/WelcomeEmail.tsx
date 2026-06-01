import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({
  name = "there",
  dashboardUrl = "http://localhost:3000/dashboard",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f4f4f4" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
          <Heading>Welcome to LearnFlow, {name}!</Heading>
          <Text>
            Your account is ready. Start studying with your AI tutor, notes,
            and quizzes.
          </Text>
          <Button
            href={dashboardUrl}
            style={{
              backgroundColor: "#111",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
            }}
          >
            Go to Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
