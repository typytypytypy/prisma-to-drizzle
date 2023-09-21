# Prisma Schema to Drizzle Converter

This repository contains a sample project that demonstrates how to convert a Prisma schema into a Drizzle ORM schema

## Prerequisites

Before you begin, ensure you have the following installed:

2. **Yarn **: While you can use npm, we recommend Yarn for managing dependencies as it provides a more efficient and reliable package management experience. You can install Yarn by following the instructions [here](https://classic.yarnpkg.com/en/docs/install/).

## Getting Started

Follow these steps to set up and run the Prisma Schema to Drizzle Converter:

1. Clone this repository:

   ```bash
   git clone https://github.com/typytypytypy/prisma-to-drizzle.git
   ```

2. Navigate to the project directory:

   ```bash
   cd prisma-to-drizzle
   ```

3. Install project dependencies:

   ```bash
   yarn install
   ```

   Or with npm:

   ```bash
   npm install
   ```

4. Convert your Prisma schema to Drizzle schema:

   ```bash
   yarn run convert-prisma-to-drizzle
   ```

   This command will take your Prisma schema defined in `schema.prisma` and generate Drizzle smart contract artifacts in the `db` directory.

5. View and use the Drizzle ORM schema in queries.

## Usage

You can now start building your queries using Drizzle with the converted Prisma schema.

## Contributing

Feel free to contribute to this project by opening issues or submitting pull requests. Your contributions are greatly appreciated.

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[Disclaimer: This software is provided for informational purposes only and is not guaranteed to be production-ready. Users are solely responsible for its use, and the authors and contributors disclaim all liability for any damages or losses arising from its use.]

## Acknowledgments

Special thanks to the Prisma and Drizzle communities for their amazing tools and support.

This is an expanded version of: https://github.com/subhendupsingh/prisma-to-drizzle-schema

---

Happy coding! If you have any questions or encounter any issues, please don't hesitate to reach out for assistance.
