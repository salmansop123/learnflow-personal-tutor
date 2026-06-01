import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from "@react-email/components";

export interface ReminderEmailProps {
  name?: string;
  title: string;
  body?: string;
  link?: string;
}

export function ReminderEmail({
  name = "Student",
  title,
  body,
  link = "http://localhost:3000/dashboard",
}: ReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#f4f4f4",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: 24,
            backgroundColor: "#ffffff",
            borderRadius: 8,
          }}
        >
          <Heading style={{ fontSize: 22, marginBottom: 16 }}>
            Hi {name}, time to study!
          </Heading>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111" }}>
            {title}
          </Text>
          {body ? (
            <Text style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>
              {body}
            </Text>
          ) : null}
          <Button
            href={link}
            style={{
              backgroundColor: "#111",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            Open LearnFlow
          </Button>
          <Text style={{ fontSize: 12, color: "#888", marginTop: 24 }}>
            You scheduled this reminder in LearnFlow.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
