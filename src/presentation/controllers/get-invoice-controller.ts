import { GetInvoiceByWorkOrderId } from '@/domain/use-cases';
import { MissingParamError, NotFoundError } from '@/presentation/errors';
import { badRequest, notFound, ok, serverError } from '@/presentation/helpers';
import { Controller, HttpRequest, HttpResponse } from '@/presentation/protocols';

export class GetInvoiceController implements Controller {
  constructor(private readonly getInvoice: GetInvoiceByWorkOrderId) {}

  async handle(params: Request): Promise<Response> {
    try {
      const workOrderId = params.params?.workOrderId;
      if (!workOrderId) return badRequest(new MissingParamError('workOrderId'));
      const invoice = await this.getInvoice.getByWorkOrderId({ workOrderId });
      return ok(invoice);
    } catch (error: any) {
      if (error instanceof NotFoundError) return notFound(error);
      return serverError(error);
    }
  }
}

type Request = HttpRequest;
type Response = HttpResponse<GetInvoiceByWorkOrderId.Result>;
