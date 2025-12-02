import Image from 'next/image';
import { AuthForm } from '@/components/auth-form';
import { placeholderImages } from '@/lib/placeholder-images';

export default function AuthenticationPage() {
  const authImage = placeholderImages.find(p => p.id === "auth-background");
  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">ASSAM</h1>
            <p className="text-balance text-muted-foreground">
              Bienvenido al Registro de Personal
            </p>
          </div>
          <AuthForm />
          <div className="mt-4 text-center text-sm">
            © {new Date().getFullYear()} ASSAM. Todos los derechos reservados.
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {authImage && (
            <Image
              src={authImage.imageUrl}
              alt={authImage.description}
              width="1920"
              height="1080"
              className="h-full w-full object-cover"
              data-ai-hint={authImage.imageHint}
            />
        )}
      </div>
    </div>
  );
}
