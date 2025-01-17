# node-grpc-error-details

[![Build and test](https://github.com/Q42Philips/node-grpc-error-details/actions/workflows/build-and-test.yaml/badge.svg)](https://github.com/Q42Philips/node-grpc-error-details/actions/workflows/build-and-test.yaml)
![GitHub release (with filter)](https://img.shields.io/github/v/release/q42philips/node-grpc-error-details)


Utility function for deserializing the `grpc-status-details-bin` metadata value when using the [grpc-js](https://github.com/grpc/grpc-node) package. Error details allow sending/receiving additional data along with an error. For instance, if a request sends invalid data, a gRPC server could send back a [BadRequest](./src/proto/error_details.proto#L119) message identifying the field and why it failed validation.

gRPC services that send rich error details place information in the `grpc-status-details-bin` metadata property of the [ServiceError](https://grpc.io/grpc/node/grpc.html#~ServiceError) passed to the callback of a failed gRPC method call. The value of the `grpc-status-details-bin` field is a serialized [Status](./src/proto/status.proto) message. The Status message's details field is an array of [Any](https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/any.proto#L122) messages, which consist of a type field and the serialized data for that message type.

This library, given an error, returns back the deserialized Status message and an array of deserialized detail messages.

## Install

```bash
# npm
npm install @q42philips/node-grpc-error-details
```

## Usage

Both exported functions return the same type of object.

```
{
  status: Status
  details: DetailType[]
}
```

where `status` is a [Google rpc Status message](./src/proto/status.proto) and `details` is the `Status`'s details array with each item deserialized and unpacked from an `Any` message to its actual message type.

`deserializeGrpcStatusDetails` allows passing in the `deserializeMap` argument, where each key is a message type and each value is its corresponding deserialize function.

`deserializeGoogleGrpcStatusDetails` behaves exactly the same as `deserializeGrpcStatusDetails`, but provides a default deserializeMap using [Google's rpc error details types](./src/proto/error_details.proto).
### deserializeGoogleGrpcStatusDetails(error)

Example:

```ts
import {
  deserializeGoogleGrpcStatusDetails,
  BadRequest
} from "@q42philips/node-grpc-error-details";

const point = { latitude: 409146138, longitude: -746188906 };

// Make grpc call that fails and returns a Status object with
// details in the `grpc-status-details-bin` Metadata property
stub.getFeature(point, function(err, feature) {
  if (err) {
    const grpcErrorDetails = deserializeGoogleGrpcStatusDetails(err);
    if (grpcErrorDetails) {
      const { status, details } = grpcErrorDetails;

      // Search for an instance of BadRequest in details and do something if found
      for (let i = 0; i < details.length; i++) {
        if (details[i] instanceof BadRequest) {
          console.log(details[i].toObject());
        }
      }
    }
  } else {
    // process feature
  }
});
```

### deserializeGrpcStatusDetails(error, deserializeMap)

Example:

```ts
import { deserializeGrpcStatusDetails } from "@q42philips/node-grpc-error-details";
import {
  RetryInfo,
  DebugInfo,
  QuotaFailure,
  PreconditionFailure,
  CustomError
} from "./custom_error_pb";

// Define the types of errors we want to deserialize
const deserializeMap = {
  "stackpath.rpc.RetryInfo": RetryInfo.deserializeBinary,
  "stackpath.rpc.DebugInfo": DebugInfo.deserializeBinary,
  "stackpath.rpc.QuotaFailure": QuotaFailure.deserializeBinary,
  "stackpath.rpc.PreconditionFailure": PreconditionFailure.deserializeBinary,
  "stackpath.rpc.CustomError": CustomError.deserializeBinary
};

const point = { latitude: 409146138, longitude: -746188906 };

// Make grpc call that fails and returns a Status object with
// details in the `grpc-status-details-bin` Metadata property
stub.getFeature(point, function(err, feature) {
  if (err) {
    const grpcErrorDetails = deserializeGrpcStatusDetails(err, deserializeMap);
    if (grpcErrorDetails) {
      const { status, details } = grpcErrorDetails;

      // Search for an instance of CustomError in details and do something if found
      for (let i = 0; i < details.length; i++) {
        if (details[i] instanceof CustomError) {
          console.log(details[i].toObject());
        }
      }
    }
  } else {
    // process feature
  }
});
```
