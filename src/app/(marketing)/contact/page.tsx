import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata = {
  title: "Contact — LearnFlow",
  description: "Send us a question or message.",
};

export default function ContactPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Contact us
          </h1>
          <p className="mt-3 text-slate-600">
            Have a question? Fill out the form below and we&apos;ll get back to
            you.
          </p>
        </div>

        <div className="marketing-card mt-10 p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
