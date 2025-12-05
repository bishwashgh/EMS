import { Injectable } from '@nestjs/common';

@Injectable() //Decorator that marks the class as a provider that can be injected as a dependency
export class AppService { //Service class that contains business logic
  getHello(): string {
    return 'Hello World!';
  }
}
