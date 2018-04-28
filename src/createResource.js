import React from "react";
import { Async } from "react-async-await";
import { Context } from "./ResourceLoading";

export default function createResource(load, resolve) {
  const cache = new Map();

  function memoizedLoad(props) {
    const key = resolve(props);
    if (!cache.has(key)) cache.set(key, load(props));
    return cache.get(key);
  }

  class LoadingResource extends React.Component {
    static get displayName() {
      return `Loading(${Resource.displayName || Resource.name || "Resource"})`;
    }

    componentDidMount() {
      this.props.startLoading(this.props.resource.promise);
    }

    componentDidUpdate() {
      this.componentDidMount();
    }

    render() {
      return null;
    }
  }

  function Resource(props) {
    return (
      <Context.Consumer>
        {startLoading => {
          if (!startLoading) {
            throw new Error("missing ResourceLoading ancestor!");
          }

          return (
            <Async
              await={memoizedLoad(props)}
              waiting={promise => ({ status: 0, promise })}
              then={value => ({ status: 1, value })}
              catch={error => ({ status: 2, error })}
            >
              {resource => {
                switch (resource.status) {
                  case 0:
                    return (
                      <LoadingResource
                        startLoading={startLoading}
                        resource={resource}
                      />
                    );
                  case 1:
                    return props.children(resource.value);
                  case 2:
                  default:
                    cache.delete(resolve(props));
                    throw resource.error;
                }
              }}
            </Async>
          );
        }}
      </Context.Consumer>
    );
  }

  return Resource;
}

function noop() {}
