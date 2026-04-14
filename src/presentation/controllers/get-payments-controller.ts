import { GetPaymentByWorkOrderId } from '@/domain/use-cases';
import { MissingParamError } from '@/presentation/errors';
import { badRequest, ok, serverError } from '@/presentation/helpers';
import { Controller, HttpRequest, HttpResponse } from '@/presentation/protocols';

export class GetPaymentsController implements Controller {
  constructor(private readonly getPayments: GetPaymentByWorkOrderId) {}

  async handle(params: Request): Promise<Response> {
    try {
      const workOrderId = params.params?.workOrderId;
      if (!workOrderId) return badRequest(new MissingParamError('workOrderId'));
      const payments = await this.getPayments.getByWorkOrderId({ workOrderId });
      return ok(payments);
    } catch (error: any) {
      return serverError(error);
    }
  }
}

type Request = HttpRequest;
type Response = HttpResponse<GetPaymentByWorkOrderId.Result>;
