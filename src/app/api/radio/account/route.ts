import { registrationClosedResponse } from '@/lib/registration-closed';

// Registration is retired on nowis.store. Existing login routes remain available.
export async function POST(request: Request) {
  void request;
  return registrationClosedResponse();
}
