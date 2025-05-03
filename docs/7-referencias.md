# 7. Referências e Recursos

## 7.1 Documentação Oficial das Tecnologias

### 7.1.1 Framework e Frontend

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
  - [App Router](https://nextjs.org/docs/app)
  - [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
  - [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

- **React**: [react.dev](https://react.dev)
  - [Hooks](https://react.dev/reference/react)
  - [Context API](https://react.dev/reference/react/createContext)

- **TypeScript**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs/)

- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

### 7.1.2 Backend e Banco de Dados

- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
  - [JavaScript SDK](https://supabase.com/docs/reference/javascript/introduction)
  - [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
  - [Realtime](https://supabase.com/docs/guides/realtime)

- **JWT**: [jwt.io](https://jwt.io/introduction)

### 7.1.3 Mapas e Visualização

- **Google Maps API**: [developers.google.com/maps/documentation](https://developers.google.com/maps/documentation)
  - [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
  - [React Google Maps](https://github.com/JustFly1984/react-google-maps-api)

- **Recharts**: [recharts.org/en-US](https://recharts.org/en-US/)

### 7.1.4 Ferramentas de Teste e Deploy

- **Jest**: [jestjs.io/docs](https://jestjs.io/docs/getting-started)
- **React Testing Library**: [testing-library.com/docs/react-testing-library/intro](https://testing-library.com/docs/react-testing-library/intro)
- **Docker**: [docs.docker.com](https://docs.docker.com/)

## 7.2 Protocolos de Rastreamento

### 7.2.1 Teltonika Codec8

- **Documentação Oficial**: [wiki.teltonika-gps.com/view/Codec](https://wiki.teltonika-gps.com/view/Codec)
- **Estrutura do Protocolo**: [wiki.teltonika-gps.com/view/Codec#Codec_8](https://wiki.teltonika-gps.com/view/Codec#Codec_8)
- **Implementação**: Ver `tracker-server/protocols/teltonika.js`

### 7.2.2 Outros Protocolos (Planejado)

- **Queclink**: [queclink.com/service-support](https://www.queclink.com/service-support/)
- **Concox**: [iconcox.com/support/downloads](https://www.iconcox.com/support/downloads)
- **TK103**: Protocolo comum em rastreadores genéricos

## 7.3 Padrões de Design Adotados

### 7.3.1 Arquitetura

- **Clean Architecture**: [blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- **Repository Pattern**: [martinfowler.com/eaaCatalog/repository.html](https://martinfowler.com/eaaCatalog/repository.html)
- **Dependency Injection**: [martinfowler.com/articles/injection.html](https://martinfowler.com/articles/injection.html)

### 7.3.2 UI/UX

- **Design System**: Baseado em componentes Radix UI e Tailwind CSS
- **Princípios de Acessibilidade**: [a11yproject.com](https://www.a11yproject.com/)
- **Responsividade**: Abordagem Mobile-First

## 7.4 Bibliotecas e Utilitários Principais

| Biblioteca | Versão | Descrição | Documentação |
|------------|--------|-----------|--------------|
| Next.js | 15.1.4 | Framework React | [nextjs.org](https://nextjs.org/) |
| React | 18.2.0 | Biblioteca UI | [react.dev](https://react.dev/) |
| Supabase | 2.49.4 | Backend-as-a-Service | [supabase.com](https://supabase.com/) |
| Zod | 3.24.3 | Validação de esquemas | [zod.dev](https://zod.dev/) |
| React Hook Form | 7.54.2 | Gerenciamento de formulários | [react-hook-form.com](https://react-hook-form.com/) |
| TailwindCSS | 3.4.1 | Framework CSS utilitário | [tailwindcss.com](https://tailwindcss.com/) |
| React Google Maps | 2.19.3 | Integração com Google Maps | [github.com/JustFly1984/react-google-maps-api](https://github.com/JustFly1984/react-google-maps-api) |
| JWT | 9.0.2 | Tokens de autenticação | [jwt.io](https://jwt.io/) |
| Recharts | 2.12.4 | Gráficos para React | [recharts.org](https://recharts.org/) |

## 7.5 Tutoriais e Recursos de Aprendizado

### 7.5.1 Next.js e React

- [Learn Next.js](https://nextjs.org/learn)
- [React Docs Beta](https://beta.reactjs.org/)
- [TypeScript with React](https://www.typescriptlang.org/docs/handbook/react.html)

### 7.5.2 Supabase

- [Supabase Tutorial](https://supabase.com/docs/guides/getting-started)
- [Build a User Management App](https://supabase.com/docs/guides/getting-started/tutorials/with-react)

### 7.5.3 Geolocalização e Mapas

- [Introduction to Google Maps API](https://developers.google.com/maps/documentation/javascript/tutorial)
- [Geocercas com Google Maps](https://developers.google.com/maps/documentation/javascript/examples/drawing-tools)

## 7.6 Comunidade e Suporte

- **GitHub**: [github.com/yukz/vehicle-tracking](https://github.com/yukz/vehicle-tracking)
- **Suporte**: suporte@yukz.com
- **Reportar Bugs**: [github.com/yukz/vehicle-tracking/issues](https://github.com/yukz/vehicle-tracking/issues)

## 7.7 Ferramentas Recomendadas

- **VS Code**: [code.visualstudio.com](https://code.visualstudio.com/) - Editor recomendado
- **Postman**: [postman.com](https://www.postman.com/) - Teste de APIs
- **Docker Desktop**: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) - Gerenciamento de contêineres
- **Supabase CLI**: [supabase.com/docs/reference/cli](https://supabase.com/docs/reference/cli) - Interação com Supabase
- **Chrome DevTools**: [developers.google.com/web/tools/chrome-devtools](https://developers.google.com/web/tools/chrome-devtools) - Depuração frontend 