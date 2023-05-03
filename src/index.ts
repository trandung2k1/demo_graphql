import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import colors from 'colors';
import morgan from 'morgan';
import { authors, books } from './db/data';
const typeDefs = `#graphql
    type Book{
        id: ID!,
        title: String
        genre: String
        author: Author
    }
    type Author {
        id: ID!
        name: String
        age: Int
        books: [Book]
    }
    type Query {
        hello: String
        books: [Book]
        authors: [Author]
        author(id: ID!): Author
        book(id: ID!): Book
    }
    type Mutation {
        createAuthor(name: String, age: Int): Author
        createBook(title: String, genre: String, authorId: ID!): Book
    }
`;
const resolvers = {
    Query: {
        hello: () => 'world',
        books: () => books,
        authors: () => authors,
        book: (parent: any, args: any, context: any, info: any) => {
            // console.log(context.hi());
            // console.log(info);
            // console.log(args); //query
            return books.find((book) => book.id === +args.id);
        },
        author: (parent: any, args: any, context: any, info: any) => {
            return authors.find((author) => author.id === +args.id);
        },
    },
    Book: {
        author: (parent: any, args: any, context: any, info: any) => {
            return authors.find((author) => author.id === parent.authorId);
        },
    },
    Author: {
        books: (parent: any, args: any, context: any, info: any) => {
            return books.filter((book) => book.authorId === parent.id);
        },
    },
    Mutation: {
        createAuthor: (parent: any, args: any, context: any, info: any) => {
            const id = Math.floor(Math.random() * 100) + 10;
            authors.push({ ...args, id: id });
            return {
                ...args,
                id: id,
            };
        },
        createBook: (parent: any, args: any, context: any, info: any) => {
            const id = Math.floor(Math.random() * 100) + 10;
            books.push({ ...args, id: id });
            return {
                ...args,
                id: id,
            };
        },
    },
};
const app = express();
app.use(morgan('combined'));
const httpServer = http.createServer(app);
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

(async () => {
    await server.start();
    app.use(
        cors(),
        bodyParser.json({ limit: '10mb' }),
        bodyParser.urlencoded({ extended: false, limit: '10mb' }),
        expressMiddleware(server, {
            context: async () => {
                return {
                    hi: () => 'Hi',
                };
            },
        }),
    );
    await new Promise((resolve: any) => httpServer.listen({ port: 4000 }, resolve));
    console.log(colors.green(`🚀 Server ready at http://localhost:4000`));
})();
