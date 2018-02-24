import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import { getOptions } from 'loader-utils';
import { join } from 'path';
import { loader } from 'webpack';

import validationError from './validation-error';
import { GraphQLLoaderOptions, defaultLoaderOptions } from './loader-options';
import { splitDocument, verifyDocuments } from './query-validators';

export interface GraphQLBlockAttributes {
  alias?: string;
}

export const defaultHandlerPath = join(__dirname, 'handlers', 'default');

export const withOptions = (
  options: GraphQLLoaderOptions = defaultLoaderOptions
) =>
  function graphqlLoader(this: loader.LoaderContext, source: string) {
    const attrs = getOptions(this) as GraphQLBlockAttributes;
    const gqlDocument = gql(source) as DocumentNode;
    const documents = splitDocument(gqlDocument);

    const handler = (options && options.handler) || defaultHandlerPath;

    const returnLoaderResults = this.async() as loader.loaderCallback;

    console.log('attrs:', attrs);
    verifyDocuments(documents, options)
      .then(() => {
        returnLoaderResults(
          null,
          `
        let gqlDocs = ${JSON.stringify(documents)};
        let attrs = ${JSON.stringify(attrs)} || {};
        let handler = require(${JSON.stringify(handler)});

        if (handler.default) {
          handler = handler.default;
        }
        module.exports = function(component) {
          handler(component, gqlDocs, attrs);
        }`
        );
      })
      .catch(validationError(this, returnLoaderResults));
  };

export default withOptions();
