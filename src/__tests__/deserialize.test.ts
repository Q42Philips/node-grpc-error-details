import { Metadata } from '@grpc/grpc-js';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import {
  BadRequest,
  ResourceInfo,
  Status,
  deserializeGrpcStatusDetails,
  deserializeGoogleGrpcStatusDetails,
  ErrorInfo,
} from '../index';

function createBadRequestError() {
  const fieldViolation1 = new BadRequest.FieldViolation();
  fieldViolation1.setField('field1');
  fieldViolation1.setDescription('field1 is not valid');
  const fieldViolation2 = new BadRequest.FieldViolation();
  fieldViolation2.setField('field2');
  fieldViolation2.setDescription('field2 is not valid');

  const badRequest = new BadRequest();
  badRequest.setFieldViolationsList([fieldViolation1, fieldViolation2]);

  const anyBadRequest = new Any();
  anyBadRequest.pack(badRequest.serializeBinary(), 'google.rpc.BadRequest');

  const resourceInfo = new ResourceInfo();
  resourceInfo.setResourceName('resourceName');
  resourceInfo.setResourceType('resourceType');
  resourceInfo.setOwner('Owner');
  resourceInfo.setDescription('Resource Info Description');

  const anyResourceInfo = new Any();
  anyResourceInfo.pack(resourceInfo.serializeBinary(), 'google.rpc.ResourceInfo');

  const status = new Status();
  status.setCode(3);
  status.setMessage('INVALID_ARGUMENT: value is invalid');
  status.setDetailsList([anyBadRequest, anyResourceInfo]);

  const statusSerialized = status.serializeBinary();
  const buffer = Buffer.from(statusSerialized);
  const metadata = new Metadata();
  metadata.set('grpc-status-details-bin', buffer);

  return {
    name: 'Error',
    message: 'Error Message',
    metadata,
  };
}

function createErrorInfoError() {
  const errorInfo = new ErrorInfo();
  errorInfo.setDomain('domain');
  errorInfo.setReason('reason');
  errorInfo.getMetadataMap().set('key', 'value');

  const anyErrorInfo = new Any();
  anyErrorInfo.pack(errorInfo.serializeBinary(), 'google.rpc.ErrorInfo');

  const resourceInfo = new ResourceInfo();
  resourceInfo.setResourceName('resourceName');
  resourceInfo.setResourceType('resourceType');
  resourceInfo.setOwner('Owner');
  resourceInfo.setDescription('Resource Info Description');

  const anyResourceInfo = new Any();
  anyResourceInfo.pack(resourceInfo.serializeBinary(), 'google.rpc.ResourceInfo');

  const status = new Status();
  status.setCode(5);
  status.setMessage('NOT_FOUND: value is not found');
  status.setDetailsList([anyErrorInfo, anyResourceInfo]);

  const statusSerialized = status.serializeBinary();
  const buffer = Buffer.from(statusSerialized);
  const metadata = new Metadata();
  metadata.set('grpc-status-details-bin', buffer);

  return {
    name: 'Error',
    message: 'Error Message',
    metadata,
  };
}

describe('deserialize', () => {
  describe('deserializeGoogleGrpcStatusDetails', () => {
    it('deserializes grpc-status-details-bin with default google rpc error details with badRequest', () => {
      const serviceError = createBadRequestError();

      const deserialized = deserializeGoogleGrpcStatusDetails(serviceError);

      expect(deserialized).not.toEqual(null);

      expect(Object.keys(deserialized!)).toMatchSnapshot();

      const deserializedObj = {
        status: deserialized!.status.toObject(),
        details: deserialized!.details.map((d) => d.toObject()),
      };

      expect(deserializedObj).toMatchSnapshot();
    });
  });

  describe('deserializeGoogleGrpcStatusDetails', () => {
    it('deserializes grpc-status-details-bin with default google rpc error details with errorInfo', () => {
      const serviceError = createErrorInfoError();

      const deserialized = deserializeGoogleGrpcStatusDetails(serviceError);

      expect(deserialized).not.toEqual(null);

      expect(Object.keys(deserialized!)).toMatchSnapshot();

      const deserializedObj = {
        status: deserialized!.status.toObject(),
        details: deserialized!.details.map((d) => d.toObject()),
      };

      expect(deserializedObj).toMatchSnapshot();
    });
  });

  describe('deserializeGrpcStatusDetails', () => {
    it('deserializes grpc-status-details-bin with custom rpc error details', () => {
      const serviceError = createBadRequestError();
      const deserialized = deserializeGrpcStatusDetails(serviceError, {
        'google.rpc.ResourceInfo': ResourceInfo.deserializeBinary,
        'google.rpc.BadRequest': BadRequest.deserializeBinary,
      });

      expect(deserialized).not.toEqual(null);

      expect(Object.keys(deserialized!)).toMatchSnapshot();

      const deserializedObj = {
        status: deserialized!.status.toObject(),
        details: deserialized!.details.map((d) => d.toObject()),
      };

      expect(deserializedObj).toMatchSnapshot();
    });
  });
});
