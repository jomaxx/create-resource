import React from "react";
import { render } from "react-testing-library";
import { createResource, ResourceLoading } from "../src";

function delay(...args) {
  return new Promise(resolve => setTimeout(resolve, ...args));
}

class ErrorBoundary extends React.Component {
  componentWillMount() {
    jest.spyOn(console, "error");
    console.error.mockImplementation(() => {});
  }

  componentDidCatch(error) {
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
}

afterEach(() => {
  jest.restoreAllMocks();
});

it("loads resource", done => {
  const Resource = createResource(
    props => delay(100, { id: props.id }),
    props => props.id
  );

  render(
    <ResourceLoading>
      {loading =>
        loading ? null : (
          <Resource id={1}>
            {resource => {
              expect(resource).toEqual({ id: 1 });
              done();
              return null;
            }}
          </Resource>
        )
      }
    </ResourceLoading>
  );
});

it("throws missing ResourceLoading ancestor", done => {
  const Resource = createResource(
    props => ({ id: props.id }),
    props => props.id
  );

  render(
    <ErrorBoundary
      onError={error => {
        expect(error).toMatchSnapshot();
        done();
      }}
    >
      <Resource id={1}>{resource => null}</Resource>
    </ErrorBoundary>
  );
});

it("throws error", done => {
  const Resource = createResource(
    props => delay(100).then(() => Promise.reject(new Error("error"))),
    props => props.id
  );

  render(
    <ErrorBoundary
      onError={error => {
        expect(error).toMatchSnapshot();
        done();
      }}
    >
      <ResourceLoading>
        {() => <Resource id={1}>{resource => null}</Resource>}
      </ResourceLoading>
    </ErrorBoundary>
  );
});

it("can try again after thrown error", async () => {
  const spy = jest.fn();
  const Resource = createResource(spy, props => props.id);

  spy
    .mockImplementationOnce(() => Promise.reject(new Error("error")))
    .mockImplementationOnce(props => ({ id: props.id }));

  await new Promise(resolve => {
    render(
      <ErrorBoundary onError={resolve}>
        <ResourceLoading>
          {() => <Resource id={1}>{resource => null}</Resource>}
        </ResourceLoading>
      </ErrorBoundary>
    );
  });

  await new Promise((resolve, reject) => {
    render(
      <ErrorBoundary onError={reject}>
        <ResourceLoading>
          {() => (
            <Resource id={1}>
              {resource => {
                expect(resource).toEqual({ id: 1 });
                resolve();
                return null;
              }}
            </Resource>
          )}
        </ResourceLoading>
      </ErrorBoundary>
    );
  });
});
