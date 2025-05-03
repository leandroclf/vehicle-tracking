# Documentação de Acesso para Usuários de Teste

Este documento contém as credenciais e informações para acessar o sistema Yukz de rastreamento veicular em ambiente de testes.

## Usuários Disponíveis

### Usuário Padrão
- **Email**: teste@yukz.com
- **Senha**: teste123
- **Tipo**: individual
- **ID**: 00000000-0000-0000-0000-000000000001

### Usuário Administrador
- **Email**: admin@yukz.com
- **Senha**: admin123
- **Tipo**: large_fleet (frota grande)
- **ID**: 00000000-0000-0000-0000-000000000002

## Veículos de Demonstração

Existe um veículo de demonstração vinculado ao usuário administrador:

- **Nome**: Carro Demonstração
- **Placa**: ABC1234
- **Marca/Modelo**: Toyota Corolla
- **Ano**: 2023
- **Cor**: Prata
- **ID**: 00000000-0000-0000-0000-000000000003

## Como Acessar

1. Acesse a página de login em: `/login`
2. Insira as credenciais de um dos usuários acima
3. Após o login, você será redirecionado para o dashboard

## Rastreador Associado

O veículo de demonstração possui um rastreador:

- **IMEI**: 123456789012345
- **Protocolo**: teltonika
- **Status**: Ativo

## Posição Inicial

Uma posição inicial foi configurada para o veículo de demonstração:
- **Latitude**: -23.550520
- **Longitude**: -46.633308
- **Localização**: Centro de São Paulo

## Observações

- A senha no banco de dados está armazenada com hash bcrypt
- O sistema utiliza autenticação JWT integrada com Supabase
- O acesso às APIs é protegido e requer o token de autenticação válido

---

*Este documento é para uso exclusivo em ambiente de desenvolvimento e testes.* 