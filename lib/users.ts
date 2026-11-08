// Demo accounts. Each one points to a different customer in your Nessie account.
// ⚠️ Hackathon demo login only — real apps never store passwords in code.
//    For a real product you'd use Clerk, Auth.js, or Supabase Auth.
export interface DemoUser {
  id: string;
  email: string;
  password: string;
  name: string;
  nessieCustomerId: string;
}

export const USERS: DemoUser[] = [
  {
    id: "priya",
    email: "carrie@runway.app",
    password: "demo123",
    name: "Carrie",
    nessieCustomerId: process.env.NESSIE_CUSTOMER_ID || "d852d265-af21-4b3d-9747-c210c930d3a0",
  },
  {
    id: "marcus",
    email: "marcus@runway.app",
    password: "demo123",
    name: "Marcus",
    nessieCustomerId: "8ef5eb46-df62-455f-85bb-c2a1e5c4afd4",
  },
];

export const findUser = (id: string | undefined) => USERS.find((u) => u.id === id);
